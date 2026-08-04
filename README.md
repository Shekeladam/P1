# FC Lions

The official (fictional) website for FC Lions, an EFL Championship club — built as a learning project with Claude Code.

## Structure

- `index.html` — the page content and structure
- `css/style.css` — all styling
- `js/main.js` — squad/shortlist/fixtures/standings logic, drag-and-drop, buy/sell flows
- `images/logo.webp` — the club crest

## Features

- Full 46-game fixture list with results revealed automatically as their date passes
- Live-simulated league standings that move as games are played
- Draggable squad/bench management with position-matched swaps
- A transfer shortlist you can refresh, buy from (with budget tracking), and sell to (with a 24-hour offer wait)
- Player ages and ratings that evolve over real time (birthdays, career progression, retirement at 36)

## Preview it locally

No build step needed — just open `index.html` in a browser, or run a local server:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000

## Deploy

Since it's just static files, you can host it for free on GitHub Pages, Netlify, or Vercel whenever you're ready.
