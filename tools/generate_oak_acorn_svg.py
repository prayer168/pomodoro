from pathlib import Path
from xml.sax.saxutils import escape


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "oak-acorn.svg"


def tag(name, attrs=None, children=None, text=""):
    attrs = attrs or {}
    attr_text = "".join(f' {key}="{escape(str(value))}"' for key, value in attrs.items())
    if children is None and not text:
        return f"<{name}{attr_text}/>"
    body = text + "".join(children or [])
    return f"<{name}{attr_text}>{body}</{name}>"


def acorn(x, y, scale=1.0):
    return tag(
        "g",
        {"class": "acorn", "transform": f"translate({x} {y}) scale({scale})"},
        [
            tag("path", {"class": "acorn-body", "d": "M0 8 C-10 10 -15 20 -12 31 C-9 43 0 50 10 42 C19 34 19 17 10 10 C7 8 4 7 0 8Z"}),
            tag("path", {"class": "acorn-cap", "d": "M-14 9 C-8 -2 7 -4 16 5 C11 12 -5 14 -14 9Z"}),
            tag("path", {"class": "acorn-stem", "d": "M4 -2 C8 -8 12 -10 17 -12"}),
        ],
    )


def oak_leaf(x, y, scale=1.0, rotate=0, cls="leaf"):
    return tag(
        "path",
        {
            "class": cls,
            "transform": f"translate({x} {y}) rotate({rotate}) scale({scale})",
            "d": "M0 -38 C12 -32 15 -21 10 -12 C23 -10 26 4 14 11 C22 22 9 34 -2 27 C-9 38 -24 28 -18 15 C-32 15 -34 -2 -20 -8 C-31 -18 -17 -32 -8 -22 C-7 -30 -4 -35 0 -38Z",
        },
    )


def catkin(x, y, length=58, rotate=0):
    beads = [
        tag("circle", {"class": "catkin-bead", "cx": "-5" if i % 2 == 0 else "5", "cy": 8 + i * (length / 8), "r": "4"})
        for i in range(7)
    ]
    return tag(
        "g",
        {"class": "catkin", "transform": f"translate({x} {y}) rotate({rotate})"},
        [tag("path", {"class": "catkin-stem", "d": f"M0 0 C-5 {length * 0.26} 5 {length * 0.58} 0 {length}"})] + beads,
    )


def main():
    svg = tag(
        "svg",
        {
            "xmlns": "http://www.w3.org/2000/svg",
            "viewBox": "0 0 430 320",
            "role": "img",
            "aria-labelledby": "title desc",
        },
        [
            tag("title", text="橡樹從小苗到橡實動畫"),
            tag("desc", text="小苗先長出子葉與真葉，再長成橡樹，開出橡樹花序，最後結成橡實。"),
            tag(
                "style",
                text="""
                  .sky{fill:#dff3ec}.sun{fill:#ffd666}.cloud{fill:rgba(255,255,255,.58)}.ground{fill:#6ca24d}
                  .seed{fill:#9b6a35}.root,.sprout-stem{stroke:#9b6a3d;stroke-linecap:round;fill:none}.root{stroke-width:3}.sprout-stem{stroke-width:5}
                  .cotyledon{fill:#9fbd6b}.young-leaf,.leaf{fill:#527f3c}.leaf-dark{fill:#365f2b}.leaf-hi{fill:#66934e}
                  .trunk{fill:#9b6a3d}.trunk-line,.branch{stroke:#75502f;stroke-linecap:round;fill:none}.trunk-line{stroke-width:5}.branch{stroke-width:8}
                  .catkin-stem{stroke:#b7a54b;stroke-width:3;stroke-linecap:round;fill:none}.catkin-bead{fill:#d9ca65}
                  .flower-base{fill:#8aaa50}.flower-stigma{stroke:#e6d253;stroke-width:3;stroke-linecap:round;fill:none}
                  .acorn-body{fill:#9b6a35}.acorn-cap{fill:#6e4729}.acorn-stem{stroke:#6e4729;stroke-width:4;stroke-linecap:round;fill:none}
                  .seedling{transform-origin:205px 248px;animation:seedling 6s ease-in-out infinite}
                  .oak{transform-origin:215px 248px;animation:oak 6s ease-in-out infinite}
                  .young-leaf{animation:leafing 6s ease-in-out infinite}.catkin,.female-flower{animation:flower 6s ease-in-out infinite}
                  .acorn{transform-box:fill-box;transform-origin:center;animation:fruit 6s ease-in-out infinite}
                  @keyframes seedling{0%{opacity:1;transform:scale(.65)}40%{opacity:1;transform:scale(1)}63%,100%{opacity:.12;transform:scale(1)}}
                  @keyframes oak{0%,34%{opacity:0;transform:scale(.28)}68%,100%{opacity:1;transform:scale(1)}}
                  @keyframes leafing{0%,16%{opacity:0}40%,100%{opacity:1}}
                  @keyframes flower{0%,62%{opacity:0;transform:scale(.45)}80%,100%{opacity:1;transform:scale(1)}}
                  @keyframes fruit{0%,84%{opacity:0;transform:scale(.55)}100%{opacity:1;transform:scale(1)}}
                """,
            ),
            tag("rect", {"class": "sky", "width": "430", "height": "320", "rx": "18"}),
            tag("circle", {"class": "sun", "cx": "342", "cy": "62", "r": "26"}),
            tag("ellipse", {"class": "cloud", "cx": "92", "cy": "62", "rx": "34", "ry": "12"}),
            tag("ellipse", {"class": "cloud", "cx": "280", "cy": "118", "rx": "24", "ry": "9"}),
            tag("ellipse", {"class": "ground", "cx": "215", "cy": "300", "rx": "255", "ry": "74"}),
            tag(
                "g",
                {"class": "seedling"},
                [
                    tag("path", {"class": "seed", "d": "M188 258 C169 253 159 237 166 224 C174 209 199 212 208 229 C216 244 207 259 188 258Z"}),
                    tag("path", {"class": "root", "d": "M203 237 C210 251 221 261 237 267 M207 244 C202 256 193 265 181 271"}),
                    tag("path", {"class": "sprout-stem", "d": "M206 238 C204 215 209 196 224 179"}),
                    tag("ellipse", {"class": "cotyledon", "cx": "206", "cy": "222", "rx": "25", "ry": "12", "transform": "rotate(-22 206 222)"}),
                    oak_leaf(228, 180, 0.55, 22, "young-leaf"),
                    oak_leaf(207, 195, 0.44, -48, "young-leaf"),
                ],
            ),
            tag(
                "g",
                {"class": "oak"},
                [
                    tag("path", {"class": "trunk", "d": "M199 248 C199 210 203 176 212 140 C221 176 231 211 231 248Z"}),
                    tag("path", {"class": "trunk-line", "d": "M214 238 C214 202 217 174 224 150"}),
                    tag("path", {"class": "branch", "d": "M215 174 C184 158 160 138 140 110 M218 166 C247 146 273 125 292 94 M214 194 C178 190 150 179 122 154 M221 196 C255 192 289 179 312 154"}),
                    oak_leaf(150, 112, 1.05, -34, "leaf-dark"),
                    oak_leaf(216, 88, 1.2, 8, "leaf"),
                    oak_leaf(286, 116, 1.02, 36, "leaf-hi"),
                    oak_leaf(126, 160, 0.82, -62, "leaf"),
                    oak_leaf(316, 160, 0.82, 58, "leaf-dark"),
                    oak_leaf(216, 164, 1.18, 0, "leaf"),
                    catkin(178, 138, 60, 8),
                    catkin(254, 132, 54, -10),
                    catkin(294, 160, 48, 14),
                    tag("g", {"class": "female-flower", "transform": "translate(226 126)"}, [
                        tag("circle", {"class": "flower-base", "cx": "0", "cy": "0", "r": "7"}),
                        tag("path", {"class": "flower-stigma", "d": "M0 -5 C-8 -13 -9 -20 -5 -25 M1 -6 C2 -16 8 -20 15 -23 M-1 -5 C-1 -16 -2 -21 -8 -27"}),
                    ]),
                    acorn(174, 132, 0.7),
                    acorn(243, 118, 0.8),
                    acorn(222, 170, 0.72),
                ],
            ),
        ],
    )
    OUT.write_text(svg, encoding="utf-8")
    print(OUT)


if __name__ == "__main__":
    main()
