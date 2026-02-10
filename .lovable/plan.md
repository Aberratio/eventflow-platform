

# Plan: Fix moderator "Panel" and "Panel moderacji" links

## Problem

Both "Panel" and "Panel moderacji" links in the user dropdown menu point to `/moderator`. When a moderator is already on `/moderator`, React Router's `<Link>` component ignores navigation to the same path -- the dropdown closes but nothing visibly happens.

## Solution

Replace the `<Link>` elements for dashboard navigation with `onClick` handlers that:
1. Use `navigate()` to go to the target route
2. If already on the target route, scroll to top to provide visual feedback
3. Close the dropdown menu properly

## File to modify

| File | Change |
|------|--------|
| `src/components/layout/Header.tsx` | Replace Link-based dropdown items for "Panel" and role-specific links with onClick handlers that force navigation |

## Technical details

### Header.tsx changes

Replace the "Panel" dropdown item (line 198-203) and the moderator "Panel moderacji" item (lines 220-227) with `onClick`-based `DropdownMenuItem` elements:

```typescript
// "Panel" item
<DropdownMenuItem onClick={() => {
  const target = getDashboardLink();
  if (location.pathname === target) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    navigate(target);
  }
}}>
  <LayoutDashboard className="h-4 w-4 mr-2" />
  Panel
</DropdownMenuItem>

// "Panel moderacji" item (moderator-specific)
<DropdownMenuItem onClick={() => {
  if (location.pathname === '/moderator') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    navigate('/moderator');
  }
}}>
  <Settings className="h-4 w-4 mr-2" />
  Panel moderacji
</DropdownMenuItem>
```

The same pattern will be applied to the participant "Moje zawody" and organizer "Zarzadzaj wydarzeniami" links for consistency.

