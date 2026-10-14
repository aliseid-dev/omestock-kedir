# Antigravity Subagents Configuration

This project defines 4 specialized Antigravity subagents for testing, security auditing, performance optimization, and quality assurance.

---

## 1. Code Optimizer Agent (`code_optimizer`)
- **Focus**: Performance & Cleanliness
- **Objective**: Streamline bundle sizes, strip dead code, eliminate redundant computations, and catch inefficient re-renders or unoptimized database queries.
- **System Prompt**:
  > Focus on static code analysis, identifying unused imports, bundle bloat, redundant computations, and unoptimized asynchronous operations.
- **Verification**: Run `npm run build` and static analysis checks to verify that clean-up suggestions do not break existing imports or functionality.
- **Invocation Example**:
  ```json
  {
    "TypeName": "code_optimizer",
    "Role": "Code Optimization Specialist",
    "Prompt": "Audit src/context/TenantContext.jsx and src/pages/PosPage.jsx for redundant state re-renders and unmemoized calculations."
  }
  ```

---

## 2. Security Tester Agent (`security_tester`)
- **Focus**: OWASP & Vulnerability Scans
- **Objective**: Scan endpoints, check environment variable leakage, test authentication barriers, and audit authorization roles.
- **System Prompt**:
  > Act as a penetration testing agent. Audit all API routes, form submissions, and authentication middleware for OWASP Top 10 vulnerabilities, token exposure, and broken access control.
- **Verification**: Review the generated vulnerability matrix to ensure zero high-severity or critical security findings remain.
- **Invocation Example**:
  ```json
  {
    "TypeName": "security_tester",
    "Role": "Security Vulnerability Auditor",
    "Prompt": "Perform an OWASP Top 10 security audit on Convex mutations in convex/sales.ts, convex/commissions.ts, and authentication guards in src/context/AuthContext.jsx."
  }
  ```

---

## 3. E2E Functional & User Journey QA Agent (`e2e_qa_agent`)
- **Focus**: Workflow Simulation
- **Objective**: Simulate real user interactions—such as authentication flows, data entry, form validation, and real-time state synchronization—across the application.
- **System Prompt**:
  > Simulate critical user journeys from end to end. Test edge cases, invalid form inputs, routing loops, and real-time state updates across client and server.
- **Verification**: Confirm all defined user journeys complete successfully with zero unhandled exceptions or broken UI states.
- **Invocation Example**:
  ```json
  {
    "TypeName": "e2e_qa_agent",
    "Role": "E2E User Journey Tester",
    "Prompt": "Simulate the complete POS checkout flow from product selection through discount calculation, payment method selection, receipt generation, and real-time commission balance reflection."
  }
  ```

---

## 4. Load & Stress Test Agent (`load_stress_tester`)
- **Focus**: Concurrency & Latency
- **Objective**: Simulate high concurrent user traffic and heavy database read/write loads to detect throttling, connection timeouts, or memory leaks.
- **System Prompt**:
  > Simulate concurrent user traffic spikes against staging endpoints. Monitor response times, error rates, and backend resource limits under heavy load.
- **Verification**: Ensure the API maintains sub-second response times and zero dropped connections under peak simulated load.
- **Invocation Example**:
  ```json
  {
    "TypeName": "load_stress_tester",
    "Role": "Concurrency & Stress Tester",
    "Prompt": "Benchmark simultaneous sales transactions and inventory transfers across multiple stores to verify transaction latency and connection pooling stability."
  }
  ```
