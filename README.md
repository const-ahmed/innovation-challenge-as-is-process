# Oranges Across the Atlantic

An interactive animated story about one customs declaration with two outcomes:

- **Scenario A:** the current system, where an outdated commodity code causes a delay at the border.
- **Scenario B:** a pre-submission check that catches the code first.

It runs on the rendering engine from the Learn Arduino bench (`learn-arduino-demo.html`): an orthographic toy-table camera, ink outlines, a soft ground shadow, hover-lift and click-to-inspect.

## Run it

The page uses ES modules, so open it through a local web server, not by double-clicking the file:

```sh
python3 -m http.server 8000
# then open http://localhost:8000/customs-journey.html
```

Add `#prepare`, `#journey`, `#a` or `#b` to the URL to open a chapter directly.

## Where things live

| To change… | Edit |
| --- | --- |
| Wording, form values, the codes, end-card text, inspect cards | `src/story/script.js` |
| What happens in a scene, and in what order | `src/story/scenes/*.js` (one file per chapter) |
| Camera framings | `src/story/cameras.js` |
| The world map: projection, coastlines, map lettering | `src/story/geo.js` |
| Positions in the world (berths, port layouts, ship route, office) | `src/story/places.js` |
| Shared moves (crane transfer, sailing, the map crossing, delivery, night passing) | `src/story/actions.js` |
| The importer's poses, expressions and walk | `src/props/character.js` (`POSES`, `FACES`) |
| The assistant's moves (fly, tap, point, spin) | `src/props/assistant.js` |
| Ship, containers, crates, cranes, truck, checkpoint, office | `src/props/*.js` |
| The route line drawn on the sea during the crossing | `src/props/route.js` |
| The declaration panel and its animations | `src/ui/declaration.js` |
| Speech bubbles, stickers, tags, captions, branch choice, end cards | `src/ui/overlay.js` |
| Renderer, outlines, camera rig, hover/select, day–night mood | `src/engine/stage.js` |
| Easing and the pausable story clock | `src/engine/tween.js` |

## How a scene works

Each scene exports two functions:

- **`init(ctx)`** puts the whole world into the scene's starting state, without animation. This is what lets any chapter start on its own.
- **`run(ctx)`** plays the scene with `await`. It returns the id of the next scene, or `null` at an ending.

Inside `run`, use the helpers on `ctx`:

- `ctx.wait(ms)`: pause between beats.
- `ctx.play({...tween})`: run a tween and wait for it to finish.
- `ctx.camera(view, opts)`: move the camera and wait for it to arrive.
- `ctx.do(promise)`: wait for any other promise.

These helpers work with the pause button. They also stop a scene cleanly when the viewer jumps to another chapter. Await things through them, never with a bare `await`.

Starting a scene cancels the previous one. Its tweens stop, and its next `ctx.*` await throws, so leftover code can't change the new scene.

## Review aid

`#a~40` opens scenario A and fast-forwards 40 seconds of story time. This is for checking later moments without waiting.
