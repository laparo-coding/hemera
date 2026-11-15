---
name: specify
description: "Create or update the feature specification from a natural language feature description."
user-invocable: true
disable-model-invocation: true
---

The user input may be provided directly in the invoking message or as an argument to this skill; always use it (if not empty).

The text the user typed after the invoking message **is** the feature description.
Assume you always have it available in this conversation even if it appears only in the invoking
message. Do not ask the user to repeat it unless they provided an empty command.

Given that feature description, do this:

1. Run the script `.specify/scripts/bash/create-new-feature.sh --json "<feature description>"`
   from repo root, replacing `<feature description>` with the feature description from the
   invoking message, and parse its JSON output for BRANCH_NAME and SPEC_FILE. All file paths must be absolute.
   **IMPORTANT** You must only ever run this script once. The JSON is provided in the terminal as
   output - always refer to it to get the actual content you're looking for.
2. Load `.specify/templates/spec-template.md` to understand required sections.
3. Write the specification to SPEC_FILE using the template structure, replacing placeholders with
   concrete details derived from the feature description (arguments) while preserving section order
   and headings.
4. Report completion with branch name, spec file path, and readiness for the next phase.

Note: The script creates and checks out the new branch and initializes the spec file before writing.
