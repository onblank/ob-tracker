# AGENTS.md — application

Also read `../../AGENTS.md` and `../../../AGENTS.md`; both remain applicable to this subtree.

Use cases and orchestration. May depend on domain/contracts/settings/validation. Must not depend on SQLite implementation, Electron, React or concrete filesystem APIs. Use injected Clock/IdGenerator/UnitOfWork where deterministic or atomic behavior matters.
