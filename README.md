AI-Driven Testing
-------------------

**1) LLM (Large Language Model):** Think of an LLM (like ChatGPT or Claude) as a very smart brain or scriptwriter that understands natural language. 
                            It can read requirements or user stories and write code or test steps in plain English. 
                            However, on its own the LLM "can think, but it can't act" -it generates ideas or code, 
                            but can't click buttons or run a browser.

**2) AI Agent:** An agent is like an autonomous assistant that uses an LLM as its brain. 
          In pracrice, an AI agent makes decisions and carries out tasks using the LLM's output. 
          For example, you can imagine an AI agent as a DevOps engineer in a cloud operations center: the LLM (brain) reads the system alert 
          (e.g., "CPU usage on Node 3 exceeded threshold") and the agent (DevOps assistant) investigates the root cause, checks logs, 
          scales up resources, or restarts services if needed. The agent has autonomy - it can plan a sequence of remediation steps 
          (often using LLM reasoning and pattern recognition) to stabilize the system without human intervention, 
          like detecting memory leaks or resolving a deployment failure.


**3) Model Context Protocol (MCP)**: MCP is the bridge or translator between LLM/agent brain and the real world of tools and browsers. 
                              You can think of MCP as a universal adaptor or messenger bus. It lets the LLM send commands (in a standardized JSON format) 
                              to external resources like browsers, databases, or APIs. 
                              In simple terns, MCP "handles the doing" - it takes high-level instructions from the LLM and executes then in the environment. 
                              For example, MCP can open real browser, navigate to a URL, fill in a form, or query a database - actions an LLM cannot do by itself.
