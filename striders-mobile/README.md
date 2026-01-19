# Striders Mobile 📱

The React Native mobile app for Striders Time Trial, built with Expo.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start

# Generate GraphQL types (requires API to be running)
npm run codegen
```

## Project Structure

```
striders-mobile/
├── app/                    # Expo Router file-based routes
│   ├── _layout.tsx         # Root layout with auth gate
│   ├── sign-in.tsx         # Strava OAuth sign-in
│   ├── strava-import.tsx   # Import activities modal
│   ├── (onboarding)/       # Join club flow (pre-club)
│   │   └── index.tsx       # Join club screen
│   ├── (tabs)/             # Main app (post-club)
│   │   ├── index.tsx       # Home dashboard
│   │   └── progress.tsx    # Progress & results
│   └── event/
│       └── [id].tsx        # Event detail & leaderboard
│
├── components/             # Reusable UI components
│   ├── haptic-tab.tsx      # Tab bar button with haptics
│   └── ui/
│       └── icon-symbol.tsx # Cross-platform icon wrapper
│
├── constants/
│   └── theme.ts            # Centralized colors & theme
│
├── lib/
│   ├── graphql.ts          # GraphQL client & exports
│   └── graphql/
│       ├── operations.graphql  # All GraphQL queries/mutations
│       └── generated.ts        # Auto-generated types
│
├── stores/
│   └── auth-store.ts       # Zustand auth state (persisted)
│
└── tamagui.config.ts       # Tamagui theme configuration
```

## Architecture

### Navigation Flow

```
sign-in.tsx
    ↓ (authenticated, no club)
(onboarding)/index.tsx
    ↓ (joined club)
(tabs)/
    ├── index.tsx (Home)
    └── progress.tsx (Progress)
```

### State Management

- **Auth State**: Zustand store persisted to `expo-secure-store`
- **Server State**: TanStack Query for data fetching & caching
- **Typed GraphQL**: GraphQL Code Generator for end-to-end types

### Theme

All colors are centralized in `constants/theme.ts`:

```typescript
import { STRIDERS_TEAL, STRAVA_ORANGE, getThemeColors } from "@/constants/theme";

// In component:
const theme = getThemeColors(isDark);
<Text color={theme.text}>Hello</Text>
<Button bg={STRIDERS_TEAL}>Primary</Button>
```

## Available Scripts

| Script                  | Description                        |
| ----------------------- | ---------------------------------- |
| `npm start`             | Start Expo development server      |
| `npm run ios`           | Start on iOS simulator             |
| `npm run android`       | Start on Android emulator          |
| `npm run codegen`       | Generate GraphQL types from schema |
| `npm run codegen:watch` | Watch mode for GraphQL types       |
| `npm run lint`          | Run ESLint                         |

## Environment Variables

Create a `.env.local` file:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_STRAVA_CLIENT_ID=your_strava_client_id
```

## GraphQL Workflow

1. **Add operations** to `lib/graphql/operations.graphql`:

   ```graphql
   query MyNewQuery($id: String!) {
     entity(id: $id) {
       id
       name
     }
   }
   ```

2. **Run codegen**:

   ```bash
   npm run codegen
   ```

3. **Use in components**:

   ```typescript
   import { MyNewQueryDocument, type MyNewQueryQuery } from "@/lib/graphql";

   const { data } = useQuery({
     queryKey: ["entity", id],
     queryFn: () => graphqlRequest(MyNewQueryDocument, { id }, token),
   });
   ```

## Development Tips

- Use **Expo Go** for fastest iteration on physical devices
- Run `npm run codegen:watch` in a separate terminal during development
- Check the API at `http://localhost:3000/graphql` for schema exploration
