# MonsterManager & UIMain Refactoring Task

- [x] Consolidate repetitive UI search logic in `MonsterManager.mlua` (e.g., getting `DamageSkinSpawnerComponent` repeatedly for every hit).
- [x] Clean up `UIMain.mlua`'s `UpdateMonsterHPBars` layout recalculation, which creates and destroys UI elements very aggressively and can be a source of lag.
- [ ] Remove unused methods or variables in `ShopUI.mlua` and `InventoryUI.mlua` that act as dead code from previous iterations.
