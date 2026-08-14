# UI Golden Screen QA

Reference: `UI_REFERENCE — マッスルマスター UIコンセプトシート`

## Target viewport

- Primary: 390 × 844 CSS px
- Supported width: 320–430 CSS px
- Desktop: centered 430 px phone frame

## Home acceptance criteria

- The first viewport reads as one mobile game HUD, not a stack of web cards.
- Logo, player card, daily menu, trainer, speech, daily progress, streak, total sets, four status gauges, CTA and five-tab navigation remain visible as one composition.
- Rio remains the largest visual element, stays inside the dedicated right-side hero zone and never enters the body-status panel.
- Cream, deep red, charcoal and gold are the dominant colors.
- Runtime UI icons are vector symbols; platform emoji rendering is not used in the Golden Screen.
- Touch controls keep a clear pressed state and the bottom navigation stays fixed.
- The Home runtime loads one stylesheet: `design-match.css`.
- Reduced-motion preferences disable decorative and reward animations.

## Motion states

- Set completion: button stamp, progress interpolation, Rio cheer and mission-update toast.
- Trainer response: expression asset changes with daily progress.
- Level up: full-screen dim, title impact, trainer entrance, rotating rays, stat reward sequence and confetti.
- Navigation: short screen entrance with no long blocking transition.

## Automated checks

Run:

```sh
npm run check
```

The PWA test also verifies the consolidated stylesheet, SVG icon sprite, Level Up reward panel and Service Worker cache version (`v10`).

## Manual approval gate

Before this PR is marked Ready for review, compare the rendered 390 px Home screen beside the reference Home panel and verify:

1. Character crop and face visibility
2. No collision between the character, player/menu cards and body-status panel
3. No collision between speech and progress panels
4. CTA remains above the fixed navigation
5. No horizontal overflow at 320, 350, 375, 390 and 430 px
6. Text remains readable with the longest trainer message
7. Set-complete and Level Up animations do not obscure controls
