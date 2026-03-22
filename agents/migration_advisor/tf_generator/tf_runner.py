import json
import subprocess
import os
import tempfile
import logging
from google.genai import Client
from google.genai.types import GenerateContentConfig


logger = logging.getLogger(__name__)

def parse_terraform_output(text: str) -> dict:
    """
    Parses a markdown structured text containing multiple files like:
    ### [filename.tf]
    ```hcl
    ...
    ```
    And returns a dictionary mapping filename -> content.
    """
    files = {}
    # Split by the '### ' header
    parts = text.split("### ")
    for part in parts:
        if not part.strip():
            continue
        lines = part.split("\n", 1)
        if len(lines) < 2:
            continue
        
        # Extract filename and remove brackets
        filename = lines[0].strip().strip("[]")
        content_block = lines[1]
        
        # Now extract the content out of the first code block ```hcl or ```
        content = ""
        # Find the start of the code block
        code_block_start = content_block.find("```")
        if code_block_start != -1:
            # Skip the ``` and whatever language descriptor follows it on the same line
            first_line_end = content_block.find("\n", code_block_start)
            if first_line_end != -1:
                code_content_start = first_line_end + 1
                # Find the ending ```
                code_block_end = content_block.rfind("```")
                if code_block_end > code_content_start:
                    content = content_block[code_content_start:code_block_end].strip()
        
        if filename and content:
            files[filename] = content
            
    return files

async def run_terraform_with_self_healing(architecture_proposal: str) -> str:
    """
    Generates Terraform code from a GCP architecture proposal, runs terraform init and plan,
    and automatically heals the code if errors occur (up to 3 retries).
    """
    max_retries = 3
    current_attempt = 0
    
    # We must format the initial request so the generator knows what to do
    prompt = f"Generate Terraform code for the following architecture proposal:\n\n{architecture_proposal}"
    logger.info(f"Starting Terraform Generation. Attempt {current_attempt + 1}/{max_retries}")
    
    client = Client()
    
    # Read the instruction directly to avoid circular imports
    instruction_path = os.path.join(os.path.dirname(__file__), '..', 'prompts', 'tf_generator.txt')
    with open(instruction_path, 'r', encoding='utf-8') as f:
        sys_instruction = f.read()
        
    model_name = os.getenv("MODEL", "gemini-2.5-pro")
    config = GenerateContentConfig(system_instruction=sys_instruction)
    
    response = client.models.generate_content(
        model=model_name,
        contents=prompt,
        config=config,
    )
    
    while current_attempt < max_retries:
        clean_json = response.text.strip()
        try:
            # Parse the multi-file markdown response
            tf_files = parse_terraform_output(clean_json)
            if not tf_files:
                raise Exception("Failed to parse any files from the response. Please ensure you output files with '### [filename.tf]' header format.")
            
            with tempfile.TemporaryDirectory() as temp_dir:
                # Write files
                for filename, content in tf_files.items():
                    with open(os.path.join(temp_dir, filename), "w") as f:
                        f.write(content)
                
                # Check if terraform is available
                try:
                    subprocess.run(["terraform", "--version"], capture_output=True, check=True)
                except Exception as e:
                    return f"ERROR: Terraform is not installed or not found in system PATH. Cannot validate.\nRaw output:\n{clean_json}"
                
                # Run terraform init
                init_process = subprocess.run(
                    ["terraform", "init"], 
                    cwd=temp_dir, 
                    capture_output=True, 
                    text=True
                )
                if init_process.returncode != 0:
                    error_msg = f"Terraform Init Failed:\n{init_process.stderr}\n\n{init_process.stdout}"
                    raise Exception(error_msg)
                    
                # Run terraform plan
                plan_process = subprocess.run(
                    ["terraform", "plan"], 
                    cwd=temp_dir, 
                    capture_output=True, 
                    text=True
                )
                if plan_process.returncode != 0:
                    error_msg = f"Terraform Plan Failed:\n{plan_process.stderr}\n\n{plan_process.stdout}"
                    raise Exception(error_msg)
                
                # Success! Return the final validated code stream format for frontend tabs
                logger.info("Terraform validation passed successfully!")
                result = ""
                for filename, content in tf_files.items():
                    result += f"### {filename}\n```hcl\n{content}\n```\n\n"
                return result.strip()
                
        except Exception as e:
            current_attempt += 1
            if current_attempt >= max_retries:
                logger.error(f"Max retries reached. Last error: {str(e)}")
                return f"Failed to generate valid Terraform code after {max_retries} attempts. Last Error:\n{str(e)}\n\nLast generated JSON:\n{clean_json}"
                
            logger.warning(f"Terraform validation failed (Attempt {current_attempt}/{max_retries}). Requesting self-healing... Error: {str(e)[:200]}")
            
            # Request correction
            correction_prompt = f"The previous Terraform code you generated resulted in the following error when running `terraform plan` or `init`:\n\n{str(e)}\n\nPlease fix the code to resolve this error. DO NOT explain, return ONLY the files list starting with '### [filename.tf]' streams conforming to the specification."
            
            response = client.models.generate_content(
                model=model_name,
                contents=correction_prompt,
                config=config,
            )
            
    return "Failed unexpectedly."
