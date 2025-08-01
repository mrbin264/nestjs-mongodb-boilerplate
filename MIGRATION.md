# Module Migration Notice

⚠️ **IMPORTANT**: This file has been replaced by the new modular architecture.

## Old Structure (Deprecated)
The original `src/app.module.ts` contained all configuration in a single module.

## New Structure (Current)
The application now uses a modular architecture located in `src/modules/`:

- **CoreModule**: Global infrastructure and configuration
- **AuthModule**: Authentication and authorization
- **UsersModule**: User management features  
- **AuditModule**: Audit logging capabilities
- **AppModule**: Main application module (orchestrates all modules)

## Migration
The main application module is now located at: `src/modules/app.module.ts`

The `src/main.ts` file has been updated to import from the new location:
```typescript
import { AppModule } from './modules/app.module';
```

## Benefits
- Better separation of concerns
- Improved testability
- Easier maintenance
- Modular architecture following NestJS best practices

## Documentation
See `src/modules/README.md` for complete documentation of the new modular structure.
