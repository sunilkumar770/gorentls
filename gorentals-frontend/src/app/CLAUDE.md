# GoRentals Frontend: Coding Standards & Patterns

## Design System (Premium Marketplace)
- **Primary Color**: `#4F46E5` (Indigo). NO GREEN.
- **"No-Line" Rule**: Avoid `1px` solid borders. Use background tonal shifts (`bg-slate-50` vs `bg-white`) and ambient shadows (`shadow-[0_8px_30px_rgb(0,0,0,0.04)]`) for separation.
- **Corners**: Use `rounded-3xl` for main cards and `rounded-2xl` for sub-components.
- **Typography**: Inter (UI/Body) and Satoshi/Manrope (Headlines).

## Component Patterns
- **Listing Cards**: Use `ListingCard` with `group-hover:scale-105` on images and `group-hover:text-[#4F46E5]` on titles.
- **Badges**: Use `bg-indigo-50 text-indigo-700` for primary status and `bg-amber-50 text-amber-700` for highlights.
- **Price Display**: Format with `toLocaleString()` and use `text-2xl font-bold text-slate-900`.

## Coding Practices
- **Mock Data**: Use `MOCK_` prefixed constants for static data while awaiting API integration.
- **Icons**: Use `lucide-react` with `strokeWidth={1.5}` for a clean, editorial look.
- **Routing**: Use `Link` from `next/link` for internal navigation.
- **Image Optimization**: Always use `next/image` with proper `fill` or `width/height` and `sizes` for responsive loading.
