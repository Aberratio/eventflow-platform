# Testing Strategy

## Gates

- Fast PR gate: `npm run typecheck && npm run lint:warn && npm run test`
- Smoke E2E: `npm run test:e2e:smoke`
- Full E2E: `npm run test:e2e`

## Frontend Layers

- Use Vitest for pure logic, hooks, contexts, API adapter mapping, and components with meaningful branching.
- Use Testing Library assertions that describe user-visible behavior.
- Use Playwright for business workflows across routes and roles. Avoid assertions that only check that `body` is not empty.
- Shared Playwright helpers live in `e2e/helpers.ts`.
- Smoke E2E runs with `VITE_ENABLE_MOCKS=true`; full E2E should run with the real backend at `VITE_API_URL=http://localhost:8081/api/v1`.

## Contract Rule

Any API payload or response shape change should update the TypeScript type or adapter in `src/api`, plus at least one frontend adapter/component test that consumes the changed shape.
