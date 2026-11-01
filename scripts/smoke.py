"""Compatibility entry point for the current real-content smoke checks."""
import runpy
from pathlib import Path
runpy.run_path(str(Path(__file__).with_name("migration-test.py")),run_name="__main__")
