---
description: "Complete i18n workflow management and project-wide internationalization"
args: 
  - name: "stage"
    required: false
    type: "string"
    description: "Workflow stage: 'audit' (assess current state), 'plan' (create implementation plan), 'execute' (run full implementation), or 'complete' (full workflow)"
    default: "complete"
  - name: "scope"
    required: false
    type: "string"
    description: "Project scope: 'ui' (UI components only), 'pages' (page components), 'all' (entire project)"
    default: "all"
---

# i18n Workflow Manager

Complete workflow management for MulmoCast app internationalization project.

## Usage
```
/i18n-workflow [stage] [scope]
```

## Examples
```
/i18n-workflow audit all           # Assess current i18n state across entire project
/i18n-workflow plan pages          # Create implementation plan for page components
/i18n-workflow execute ui          # Execute i18n for UI components only
/i18n-workflow complete all        # Full end-to-end workflow (default)
```

## Task Instructions

You will manage the i18n workflow for the specified stage ({stage}) and scope ({scope}).

### Progress Tracking Integration
All workflow executions will update the progress tracking sheet at `docs/i18n/i18n-progress-tracker.md`:
- **Automatic updates** for phase completion status
- **Timestamp recording** for each stage execution  
- **Results documentation** with statistics and findings
- **Issue tracking** for problems encountered during execution

### Progress Update Pattern
```markdown
1. Read current progress sheet: `docs/i18n/i18n-progress-tracker.md`
2. Update relevant phase status and timestamps
3. Record execution results and statistics
4. Document any issues or deviations from plan
5. Save updated progress sheet
```

## Workflow Stages

### Stage 1: "audit" - Current State Assessment
1. **Update progress sheet**: Mark Phase 1 as in-progress with timestamp
2. **Scan entire codebase** for i18n readiness
3. **Analyze existing translations** in en.ts, ja.ts, common.ts
4. **Identify gaps and issues**:
   - Components without i18n
   - Missing translations
   - Inconsistent key structures
   - Hardcoded text remaining
5. **Generate project status report** and save as `docs/i18n/i18n-audit-YYYYMMDD.md`
6. **Update progress sheet**: Record audit results, statistics, and mark Phase 1 complete
7. **HUMAN CHECKPOINT**: Present audit results and wait for user approval before proceeding to planning phase

### Stage 2: "plan" - Implementation Planning
1. **Update progress sheet**: Mark Phase 2 as in-progress with timestamp
2. **Prioritize components** by complexity and importance
3. **Create implementation timeline**
4. **Identify dependencies** between components
5. **Plan translation key structure** 
6. **Estimate effort and potential issues**
7. **Generate implementation plan** and save as `docs/i18n/i18n-plan-YYYYMMDD.md`
8. **Update progress sheet**: Record priority assignments, estimates, and mark Phase 2 complete
9. **HUMAN CHECKPOINT**: Present detailed implementation plan and wait for user approval before beginning code modifications

### Stage 3: "execute" - Implementation
1. **Update progress sheet**: Mark Phase 3 as in-progress with timestamp
2. **Run refactor** on existing i18n structure (if needed)
   - Update progress sheet with refactor results
3. **Batch process components** in priority order
   - Update individual component status in progress sheet
4. **Update language files** systematically
   - Track translation key additions
5. **Validate implementation** after each batch
6. **Update progress sheet**: Record implementation statistics and mark Phase 3 complete

### Stage 4: "complete" - Full Workflow (Default)
1. **Initialize progress sheet**: Update project overview with start time and target
2. **Execute Stage 1 (audit)**: Complete audit and present results
3. **HUMAN CHECKPOINT 1**: Wait for user approval to proceed to planning
4. **Execute Stage 2 (plan)**: Create detailed implementation plan
5. **HUMAN CHECKPOINT 2**: Wait for user approval to begin code modifications
6. **Execute Stage 3 (execute)**: Run implementation with progress tracking
7. **Final validation**: 
   - Update progress sheet with final statistics
   - Mark all phases complete
   - Record total time and efficiency metrics
   - Generate completion summary

## Scope Definitions

### "ui" - UI Components Only
- `src/renderer/components/ui/**/*.vue`
- Focus on reusable UI elements
- High impact, lower complexity

### "pages" - Page Components
- `src/renderer/pages/**/*.vue`
- Application-specific functionality
- Higher complexity, varied text content

### "all" - Entire Project (Default)
- All Vue components in the project
- Complete internationalization
- Includes both UI and page components

## Execution Flow

### For "complete" stage:

#### Human Checkpoint 1: After Audit Phase
After completing the audit, the following summary will be presented:

```markdown
# 📊 i18n Audit Results Summary

## Current Project Status
- **Total components found**: X
- **Components with i18n**: Y (Z% coverage)
- **Components requiring work**: N
- **Translation structure issues**: M problems found
- **Estimated total effort**: A-B hours

## Key Findings
- [Critical issues discovered]
- [Translation gaps identified]
- [Structural problems found]

## Audit Report Generated
- **File**: `docs/i18n/i18n-audit-YYYYMMDD.md`
- **Progress tracker**: Updated with current status

---
**CHECKPOINT: Proceed to planning phase?**
**Review the audit report above and confirm to continue with planning.**
**Type 'Y' to proceed to Phase 2 (planning), or 'N' to stop here.**
```

#### Human Checkpoint 2: After Planning Phase
After completing the planning, the following summary will be presented:

```markdown
# 📋 i18n Implementation Plan Ready

## Implementation Strategy
### Priority 1: Critical Components (Est: X hours)
- [List of high-priority components with rationale]

### Priority 2: Feature Components (Est: Y hours)  
- [List of medium-priority components]

### Priority 3: Supporting Components (Est: Z hours)
- [List of low-priority components]

## Changes That Will Be Made
- **Files to modify**: N Vue components
- **Translation keys to add**: ~M new keys
- **Language files to update**: en.ts, ja.ts
- **Estimated duration**: X-Y hours total

## Implementation Plan Generated
- **File**: `docs/i18n/i18n-plan-YYYYMMDD.md`
- **Progress tracker**: Updated with implementation roadmap

---
**CHECKPOINT: Begin implementation?**
**Review the detailed plan above. This will start modifying source code.**
**Type 'Y' to proceed to Phase 3 (implementation), or 'N' to stop here.**
```

#### Phase 2: Structure Refactoring (If Needed)
- Run `/i18n-refactor all` to fix existing structure
- Consolidate duplicate translations
- Standardize key naming
- **Update progress sheet** with refactoring results

#### Phase 3: Batch Implementation
- Process components in priority order
- **Update component status in progress sheet** as each is completed
- Human review after each priority group
- Continuous validation and testing

#### Phase 4: Final Validation
- Complete translation coverage check
- Cross-language consistency validation
- Performance impact assessment
- **Update progress sheet** with final completion statistics and summary

## Human Checkpoint Implementation

### Checkpoint Behavior
- **Automatic pause**: Workflow stops at checkpoints waiting for user input
- **Clear summaries**: Each checkpoint presents actionable information
- **Approval required**: User must explicitly confirm to proceed
- **Safe exit**: Users can stop at any checkpoint without risk

### Checkpoint Responses
- **'Y' or 'yes'**: Proceed to next phase
- **'N' or 'no'**: Stop workflow safely, preserve all progress
- **Questions**: User can ask for clarification about the plan

## Safety & Quality Controls

### Pre-execution Checks
- [ ] Git working directory is clean
- [ ] Current branch backed up
- [ ] No pending language file conflicts
- [ ] Development server is running for testing
- [ ] Progress tracking sheet `docs/i18n/i18n-progress-tracker.md` is accessible

### Progress Tracking  
- **Real-time updates** to `docs/i18n-progress-tracker.md`
- **Component completion status** with timestamps
- **Translation key addition counters** for each language file
- **Error and warning logs** in the issues section
- **Time tracking** with actual vs estimated comparisons

### Quality Validation
- **Key naming consistency** across all components
- **Translation completeness** (en.ts ↔ ja.ts parity)
- **No hardcoded strings** remaining
- **Component functionality** preserved

### Rollback Plan
- Component-level rollback capability
- Language file version restoration
- Conflict resolution guidance

## Output Reports

### Audit Report
- Current i18n coverage percentage
- Priority component rankings
- Identified issues and recommendations
- Implementation effort estimates

### Progress Report
- Components completed/remaining
- Translation statistics
- Time spent vs. estimated
- Issues encountered and resolved

### Completion Report
- Final coverage statistics
- Performance impact summary
- Maintenance recommendations
- Future enhancement suggestions

This workflow manager ensures systematic, safe, and complete internationalization of the MulmoCast application.