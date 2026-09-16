# AGENTS.md — application

Use cases and orchestration. May depend on domain/contracts/settings/validation. Must not depend on SQLite implementation, Electron, React or concrete filesystem APIs. Use injected Clock/IdGenerator/UnitOfWork where deterministic or atomic behavior matters.
