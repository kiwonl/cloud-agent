import os
import sys
from dotenv import load_dotenv

current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.abspath(os.path.join(current_dir, 'agents')))

load_dotenv()

from agent.analyzer import analyzer

print("Available methods on analyzer agent:")
for item in dir(analyzer):
    if not item.startswith('_'):
        print(f" - {item}")
