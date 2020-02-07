const blessed = require('blessed');
const randomColor = require('randomcolor');

module.exports = ({ width, height }) => {
    const callList = [];
    let globalCounter = 0;

    function p(message, color, manualHeight, borderColor) {
        const { stack } = new Error();
        const strings = stack.split('\n');
        const callStack = strings.slice(2);
        callList.push({
            callStack,
            functionList: callStack.map((f) => /at ([\w.].*?) \(/.exec(f)[1]),
            counter: globalCounter,
            message,
            color,
            manualHeight,
            borderColor,
        });
        globalCounter += 1;
    }

    // Now process time
    function displayCallList(calls) {
        const messageColors = new Map();
        // The first pass through we just make note of all the functions we care about
        const functionsWeCareAbout = new Map();
        calls.forEach(({ functionList }) => {
            const sliceElement = functionList[0];
            functionsWeCareAbout.set(sliceElement, 1);
        });
        const levels = [];
        calls.forEach(({
                           manualHeight, message, counter, functionList, borderColor,
                       }) => {
            const f = functionList.filter((s) => functionsWeCareAbout.get(s));
            const number = manualHeight === undefined ? f.length - 1 : manualHeight;
            if (!levels[number]) {
                levels[number] = [];
            }
            if (!messageColors.get(message)) {
                messageColors.set(message, randomColor());
            }
            levels[number].push({
                message,
                counter,
                color: messageColors.get(message),
                borderColor,
            });
        });
        return levels;
    }

    // const boxes = displayCallList(callList);

    function renderBoxes(boxHierarchy) {
        function getBox(
            content,
            w,
            h,
            top,
            left,
            viewportBoxList,
            screen,
            color,
            borderColor = undefined,
        ) {
            // Create a box perfectly centered horizontally and vertically.
            const box = blessed.box({
                top,
                left,
                width,
                height,
                content: `{${color}-fg}${content}{/}`,
                tags: true,
                border: {
                    type: 'line',
                    fg: borderColor,
                },
            });
            box.originalLeft = left;
            box.originalTop = top;
            screen.append(box);
            viewportBoxList.push(box);
            return box;
        }


        // viewport is just [x1, y1, x2, y2]
        function getScreen() {
            // Create a screen object.
            const screen = blessed.screen({
                smartCSR: true,
            });
            const viewport = [0, 0, screen.width, screen.height];

            screen.title = 'my window title';
            screen.key(['escape', 'q', 'C-c'], () => process.exit(0));

            /**
             *
             * @param s
             * @param v
             * @param viewportBoxes {Box[]}
             */
            function render(s, v, viewportBoxes) {
                const [x1, y1] = v;
                for (let i = 0; i < viewportBoxes.length; i++) {
                    const viewportBox = viewportBoxes[i];
                    viewportBox.left = viewportBox.originalLeft + x1;
                    viewportBox.top = viewportBox.originalTop + y1;
                }
                s.render();
            }

            const o = {
                screen,
                viewport,
                viewportBoxes: [],
                moveViewport(xtransform, ytransform) {
                    viewport[0] += xtransform;
                    viewport[2] += xtransform;
                    viewport[1] += ytransform;
                    viewport[3] += ytransform;
                    render(screen, viewport, this.viewportBoxes);
                },
            };
            screen.key(['w'], () => {
                o.moveViewport(0, -5);
            });
            screen.key(['a'], () => {
                o.moveViewport(-5, 0);
            });
            screen.key(['s'], () => {
                o.moveViewport(0, 5);
            });
            screen.key(['d'], () => {
                o.moveViewport(5, 0);
            });
            return o;
        }

        const { screen, viewportBoxes } = getScreen();

        for (let i = 0; i < boxHierarchy.length; i++) {
            const boxList = boxHierarchy[i];
            if (boxList) {
                for (let j = 0; j < boxList.length; j++) {
                    const boxListElement = boxList[j];
                    if (boxListElement) {
                        const {
                            message, counter, color, borderColor,
                        } = boxListElement;
                        getBox(
                            message,
                            10,
                            5,
                            i * height,
                            counter * width,
                            viewportBoxes,
                            screen,
                            color,
                            borderColor,
                        );
                    }
                }
            }
        }
        // Render the screen.
        screen.render();
    }

    return {
        p,
        render: () => renderBoxes(displayCallList(callList)),
    };
};
