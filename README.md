# Oranges Across the Atlantic

An interactive animated story about one customs declaration with two outcomes:

- **Scenario A:** the current system, where an outdated commodity code causes a delay at the border.
- **Scenario B:** a pre-submission check that catches the code first.

It runs on the rendering engine from the Learn Arduino bench (`learn-arduino-demo.html`): an orthographic toy-table camera, ink outlines, a soft ground shadow, hover-lift and click-to-inspect.

## Run it

The page uses ES modules, so open it through a local web server, not by double-clicking the file:

```sh
python3 -m http.server 8000
# then open http://localhost:8000/
```

Add `#prepare`, `#journey`, `#a` or `#b` to the URL to open a chapter directly, or `#a.6` for a particular scene (scenario A, scene 6).

## Deploying

`index.html` is the deployable page; any static host can serve the folder as it is, with no build step. On Vercel, use the "Other" preset with the root directory `./`.

`index.html` is generated from `customs-journey.html`, which has no document skeleton because the Claude artifact host adds one. After editing `customs-journey.html`, rebuild:

```sh
node scripts/build-index.mjs
```

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
| The feedback panel (and which repo it posts to: `FEEDBACK` in `script.js`) | `src/ui/feedback.js` |
| Renderer, outlines, camera rig, hover/select, day–night mood | `src/engine/stage.js` |
| Easing and the pausable story clock | `src/engine/tween.js` |

## How a chapter works

Each chapter file exports `init(ctx)` and a list of `beats`, the scenes viewers step through with the back and next buttons. Each scene has:

- **`label`**: its name, shown in the caption bar and the feedback panel.
- **`run(ctx)`**: plays the scene with `await`. The last scene can return the next chapter's id (the branch does), or `null` to stop at an ending.
- **`end(ctx)`**: snaps the world instantly to how the scene leaves it, with no animation.

To start at scene 4, the director runs `init`, then the `end` of scenes 1–3, then plays from scene 4. So when you change what a scene does, update its `end` to match.

Inside `run`, use the helpers on `ctx`:

- `ctx.wait(ms)`: pause between beats.
- `ctx.play({...tween})`: run a tween and wait for it to finish.
- `ctx.camera(view, opts)`: move the camera and wait for it to arrive.
- `ctx.do(promise)`: wait for any other promise.
- `ctx.state`: shared between the scenes of one run, for things like a label left pinned to the container.

These helpers work with the pause button. They also stop a scene cleanly when the viewer jumps to another chapter. Await things through them, never with a bare `await`.

Starting a scene cancels whatever was playing. Its tweens stop, and its next `ctx.*` await throws, so leftover code can't change the new scene.

## Review aid

`#a~40` opens scenario A and fast-forwards 40 seconds of story time. This is for checking later moments without waiting.

## Feedback

Testers press **Feedback** (top right) or **Feedback on this scene** (in the caption bar). They pick the scene, write their comments and press **Post on GitHub**. This opens a pre-filled issue on the repo, with the scene and a link back to it. Posting needs a GitHub account; **Copy text** is there for anyone without one.
