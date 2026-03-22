import json
import logging
import os
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

def scan_gcp_infrastructure(project_id: str) -> str:
    """
    Scans the given Google Cloud Project using Cloud Asset Inventory and returns a 
    structured, aggregated summary of essential infrastructure resources. 
    It focuses on computing, networking, load balancers, DBs, and GKE clusters.
    
    Args:
        project_id: The ID of the GCP project to scan (e.g., 'my-company-prod-123')
        
    Returns:
        A JSON string containing the aggregated resource properties.
    """
    try:
        from google.cloud import asset_v1
        from google.auth import default
    except ImportError:
        return json.dumps({"error": "Google Cloud SDKs are not installed."})

    try:
        # Use explicit SA credentials if provided by the frontend payload
        creds_path = os.environ.get("TARGET_SA_CREDENTIALS_PATH")
        if creds_path and os.path.exists(creds_path):
            from google.oauth2 import service_account
            credentials = service_account.Credentials.from_service_account_file(creds_path)
            client = asset_v1.AssetServiceClient(credentials=credentials)
        else:
            # Fallback to default ADC if no SA was uploaded
            credentials, project = default()
            client = asset_v1.AssetServiceClient(credentials=credentials)
    except Exception as e:
        logger.error(f"Failed to authenticate GCP CAI client: {e}")
        return json.dumps({"error": f"Authentication failed: {e}"})

    # The scope of the search
    scope = f"projects/{project_id}"
    
    # We define the core asset types we want to gather for the Agent 1 report
    asset_types = [
        "compute.googleapis.com/Instance",
        "compute.googleapis.com/Network",
        "compute.googleapis.com/Subnetwork",
        "compute.googleapis.com/Firewall",
        "compute.googleapis.com/Router",
        "compute.googleapis.com/ForwardingRule",
        "compute.googleapis.com/InstanceGroupManager",
        "container.googleapis.com/Cluster",
        "run.googleapis.com/Service",
        "cloudfunctions.googleapis.com/CloudFunction",
        "sqladmin.googleapis.com/Instance",
        "storage.googleapis.com/Bucket",
        "iam.googleapis.com/ServiceAccount",
        "iam.googleapis.com/Role"
    ]
    
    aggregated_report = {
        "project_id": project_id,
        "resources": {}
    }

    try:
        request = asset_v1.SearchAllResourcesRequest(
            scope=scope,
            asset_types=asset_types,
            # Read all fields to get details
            read_mask="*"
        )
        
        # We limit the number of resources returned in case of massive projects
        # to prevent LLM context overflow. In production, we'd paginate and summarize further.
        response = client.search_all_resources(request=request)
        
        for resource in response:
            asset_type = resource.asset_type.split('/')[-1]
            if asset_type not in aggregated_report["resources"]:
                aggregated_report["resources"][asset_type] = []
            
            # Extract basic identifiers
            resource_info = {
                "name": resource.display_name or resource.name.split('/')[-1],
                "location": resource.location,
            }
            
            # Depending on resource type, extract key properties from the un-typed `additional_attributes`
            if resource.additional_attributes:
                for k, v in resource.additional_attributes.items():
                    # Just grab raw values for the LLM to process
                    # In real code we could map strictly, but letting LLM read raw generic config is powerful
                    try:
                        resource_info[k] = v.get("value", None)
                    except AttributeError:
                        resource_info[k] = str(v)

            aggregated_report["resources"][asset_type].append(resource_info)
            
            # Limit to top 50 per type roughly to avoid overflow
            if len(aggregated_report["resources"][asset_type]) > 50:
                aggregated_report["resources"][asset_type] = aggregated_report["resources"][asset_type][:50]
                
        try:
            iam_request = asset_v1.SearchAllIamPoliciesRequest(scope=scope)
            iam_response = client.search_all_iam_policies(request=iam_request)
            iam_policies = []
            for policy in iam_response:
                policy_dict = {"resource": policy.resource, "project": policy.project}
                if getattr(policy, "policy", None) and getattr(policy.policy, "bindings", None):
                    bindings_list = []
                    for binding in policy.policy.bindings:
                        bindings_list.append({"role": binding.role, "members": list(binding.members)})
                    policy_dict["bindings"] = bindings_list
                iam_policies.append(policy_dict)
                if len(iam_policies) >= 30:
                    break
            if iam_policies:
                aggregated_report["iam_policies"] = iam_policies
        except Exception as e:
            logger.warning(f"Failed to retrieve IAM policies: {e}")
            
    except Exception as e:
        logger.error(f"Failed to search resources in CAI: {e}")
        return json.dumps({"error": f"Failed to search CAI: {e}"})
        
    return json.dumps(aggregated_report, indent=2)


def get_specific_gcp_resource(project_id: str, resource_type: str, resource_name: str) -> str:
    """
    Specifically queries GCP for deeper settings of a single resource if the initial report lacks details.
    This acts as the 'Active Discovery' tool for the Evaluator Agent.
    
    Args:
        project_id: The ID of the GCP project (e.g., 'my-company-prod-123')
        resource_type: The generic type, e.g., 'compute.googleapis.com/Instance', 'sqladmin.googleapis.com/Instance'
        resource_name: The exact name or partial name of the resource to find.
        
    Returns:
        A detailed JSON representation of the matched resource's latest state.
    """
    try:
        from google.cloud import asset_v1
    except ImportError:
        return json.dumps({"error": "Google Cloud SDKs are not installed."})

    try:
        creds_path = os.environ.get("TARGET_SA_CREDENTIALS_PATH")
        if creds_path and os.path.exists(creds_path):
            from google.oauth2 import service_account
            credentials = service_account.Credentials.from_service_account_file(creds_path)
            client = asset_v1.AssetServiceClient(credentials=credentials)
        else:
            client = asset_v1.AssetServiceClient()
        scope = f"projects/{project_id}"
        
        # Formulate a search query using the provided resource name
        query = f"name:*{resource_name}*"
        
        request = asset_v1.SearchAllResourcesRequest(
            scope=scope,
            query=query,
            asset_types=[resource_type] if resource_type else [],
            read_mask="*" # Get all metadata
        )
        
        response = client.search_all_resources(request=request)
        
        results = []
        for resource in response:
            results.append({
                "name": resource.name,
                "asset_type": resource.asset_type,
                "location": resource.location,
                "project": resource.project,
                "additional_attributes": {k: str(v) for k, v in resource.additional_attributes.items()} if resource.additional_attributes else {}
            })
            
            # Try to return only the first highly confident match to save tokens
            if len(results) >= 3:
                break
                
        if not results:
            return json.dumps({"error": "Resource not found or inaccessible."})
            
        return json.dumps(results, indent=2)
        
    except Exception as e:
        logger.error(f"Active discovery failed: {e}")
        return json.dumps({"error": f"API call failed: {e}"})
