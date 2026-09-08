import asyncio
import json
import os
from typing import Dict, Any, List
from test_harness.workload_generator import generate_workload
from test_harness.concurrency_runner import execute_concurrency_batch

EXPERIMENTS = [
    {
        "name": "Experiment A (Low Scale)",
        "test_type": "concurrent",
        "num_tenants": 3,
        "num_operations": 100,
        "concurrency": 10,
        "retry_prob": 0.1,
        "duplicate_prob": 0.2,
        "timeout_prob": 0.0,
        "failure_prob": 0.0
    },
    {
        "name": "Experiment B (Medium Scale)",
        "test_type": "concurrent",
        "num_tenants": 3,
        "num_operations": 500,
        "concurrency": 50,
        "retry_prob": 0.2,
        "duplicate_prob": 0.3,
        "timeout_prob": 0.02,
        "failure_prob": 0.02
    },
    {
        "name": "Experiment C (High Scale)",
        "test_type": "concurrent",
        "num_tenants": 5,
        "num_operations": 1000,
        "concurrency": 100,
        "retry_prob": 0.25,
        "duplicate_prob": 0.35,
        "timeout_prob": 0.05,
        "failure_prob": 0.05
    },
    {
        "name": "Experiment D (High Retry Storm)",
        "test_type": "retry",
        "num_tenants": 3,
        "num_operations": 500,
        "concurrency": 100,
        "retry_prob": 0.50,
        "duplicate_prob": 0.60,
        "timeout_prob": 0.0,
        "failure_prob": 0.0
    },
    {
        "name": "Experiment E (Adversarial Chaos)",
        "test_type": "mixed_adversarial",
        "num_tenants": 3,
        "num_operations": 500,
        "concurrency": 100,
        "retry_prob": 0.40,
        "duplicate_prob": 0.50,
        "timeout_prob": 0.15,
        "failure_prob": 0.15
    }
]

async def run_controlled_experiments(app_instance) -> List[Dict[str, Any]]:
    benchmark_results = []
    
    for exp in EXPERIMENTS:
        workload = generate_workload(
            num_tenants=exp["num_tenants"],
            num_operations=exp["num_operations"],
            retry_prob=exp["retry_prob"],
            duplicate_prob=exp["duplicate_prob"],
            timeout_prob=exp["timeout_prob"],
            failure_prob=exp["failure_prob"]
        )
        
        baseline_m = await execute_concurrency_batch(
            app_instance=app_instance,
            workload=workload,
            implementation="BASELINE",
            concurrency=exp["concurrency"]
        )
        
        safe_m = await execute_concurrency_batch(
            app_instance=app_instance,
            workload=workload,
            implementation="SAFE",
            concurrency=exp["concurrency"]
        )
        
        result_entry = {
            "experiment": exp["name"],
            "test_type": exp["test_type"],
            "num_operations": exp["num_operations"],
            "concurrency": exp["concurrency"],
            "baseline": baseline_m.model_dump(),
            "safe": safe_m.model_dump(),
            "duplicates_prevented": baseline_m.duplicate_records_created + safe_m.duplicate_records_prevented
        }
        benchmark_results.append(result_entry)

    # Save to data/results/benchmark_runs.json
    os.makedirs("data/results", exist_ok=True)
    with open("data/results/benchmark_runs.json", "w") as f:
        json.dump(benchmark_results, f, indent=2)
        
    return benchmark_results
