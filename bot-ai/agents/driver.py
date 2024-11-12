from task_agent import TaskAgent
from planning_agent import PlanningAgent
import uuid
import json


def print_task(task):
    print("--------Task Description Start--------")
    print("Task Name:", task.get("name"))
    print("Task Description:", task.get("description").get("description"))
    print("Task Tools:", ",".join(task.get("description").get("tools")))
    print("--------Task Description End--------")


def get_args(args):
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--cache_task", action="store_true")
    parser.add_argument("--execute_mode", action="store_true")
    parser.add_argument("--save_task", action="store_true")
    parser.add_argument("--task_level", default="low")
    parser.add_argument("--mode", default="interactive")
    return parser.parse_args(args)


def print_plan(plan):
    print("-------Plan Description Start--------")
    for idx, p_step in enumerate(plan):
        print("--------Step {0} Start --------".format(idx))
        print("Description:", p_step.get("description"))
        print("Type: {0}".format(p_step.get("type")))
        print("--------Step {0} End --------".format(idx))
    print("-------Plan Description End--------")


class PlanningNode:
    def __init__(self, task):
        self.task = task
        self.children = []

    def add_children(self, child):
        self.children.append(PlanningNode(child))

    def to_json(self):
        if len(self.children) > 0:
            plan = {"task": self.task, "steps": [x.to_json() for x in self.children]}
            return plan
        else:
            plan = {"task": self.task}
            if self.task.get("type") == "executable":
                plan["action"] = "execute code"
            else:
                plan["action"] = "create subtask"
            return plan


if __name__ == "__main__":
    import sys

    args = get_args(sys.argv[1:])
    use_llm_cache = args.cache_task
    import langchain
    from langchain.cache import SQLiteCache
    import redis

    langchain.llm_cache = SQLiteCache(database_path="./llm.db")

    task_agent = TaskAgent("../pipelines/task_agent.json", use_llm_cache=use_llm_cache)
    planner = PlanningAgent(
        "../pipelines/planning_agent.json",
        "special_api.json",
        generate_code=args.execute_mode,
        max_plan_depth=2,
    )
    quitting = False

    print("Starting up agent")
    block_list = []

    while True:
        task = task_agent.create_task(
            level=args.task_level, allowlist=",".join([x for x in set(block_list)])
        )

        while True:
            print_task(task)
            cont_input = input("Is this a good task Yes (Y) No (N) Quit (Q)")
            print(cont_input)
            if cont_input.lower() in ["no", "n"]:
                task_change_options = input(
                    "What would you like to change? Tools, Description, Name"
                )
                options = set([x.lower() for x in task_change_options.split(",")])
                if "task" in options:
                    options.add("tools")
                    options.add("description")
                    new_name = input("What is the new name?")
                    task["name"] = new_name
                if "description" in options:
                    new_description = input("What is the new description")
                    task["description"]["description"] = new_description
                    options.add("tools")
                if "tools" in options:
                    new_tools = input("What are the new tools ? comman separated list")
                    if new_tools:
                        new_tools = [x.lower() for x in new_tools.split(",")]
                    else:
                        new_tools = ["aws-cli", "terraform", "kubectl"]
                    task["description"]["tools"] = new_tools
            elif cont_input.lower() in ["q", "quit"]:
                quitting = True
                break
            elif cont_input.lower() in ["y", "yes"]:
                print("Breaking out of this")
                break
            else:
                continue
        if quitting:
            print("Exiting")
            break
        print("Generating plan for task")
        root = PlanningNode(task)
        plan = planner.generate_full_plan(task, save_tree=root)
        while True:
            try:
                item = next(plan)
                print_plan(item)

            except StopIteration:
                break
            continue_breaking = input("Continue breaking down steps\n")
            if continue_breaking.lower() in ["n", "no"]:
                break
            elif continue_breaking.lower() in ["y", "yes"]:
                continue
        task_id = str(uuid.uuid4())
        with open("{0}.json".format(task_id), "w") as f:
            f.write(json.dumps(root.to_json(), indent=3))

        cont_input = input(
            "Task is complete would you like to run a new task? Yes (Y) No (N)"
        )
        if cont_input.lower() in ["n", "no"]:
            break

        block_list.extend(task["topic_words"].split(","))

    print("Exiting")
