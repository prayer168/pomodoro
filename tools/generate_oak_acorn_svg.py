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


def acorn(x, y, scale=1.0, delay="0s"):
    return tag(
        "g",
        {
            "class": "acorn",
            "transform": f"translate({x} {y}) scale({scale})",
            "style": f"animation-delay:{delay}",
        },
        [
            tag("path", {"class": "acorn-body", "d": "M0 8 C-10 10 -15 20 -12 31 C-9 43 0 50 10 42 C19 34 19 17 10 10 C7 8 4 7 0 8Z"}),
            tag("path", {"class": "acorn-cap", "d": "M-14 9 C-8 -2 7 -4 16 5 C11 12 -5 14 -14 9Z"}),
            tag("path", {"class": "acorn-stem", "d": "M4 -2 C8 -8 12 -10 17 -12"}),
        ],
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
            tag("title", text="專注橡樹與橡實動畫"),
            tag("desc", text="橡樹從小苗長大，最後在樹冠中結出橡實。"),
            tag(
                "style",
                text="""
                  .sky{fill:#dff3ec}.sun{fill:#ffd666}.ground{fill:#6ca24d}
                  .trunk{fill:#9b6a3d}.trunk-line{stroke:#75502f;stroke-width:5;stroke-linecap:round;fill:none}
                  .leaf-dark{fill:#365f2b}.leaf{fill:#527f3c}.leaf-hi{fill:#66934e}
                  .acorn-body{fill:#9b6a35}.acorn-cap{fill:#6e4729}.acorn-stem{stroke:#6e4729;stroke-width:4;stroke-linecap:round;fill:none}
                  .oak{transform-origin:215px 248px;animation:grow 4s ease-in-out infinite alternate}
                  .acorn{opacity:0;transform-box:fill-box;transform-origin:center;animation:fruit 4s ease-in-out infinite alternate}
                  @keyframes grow{0%{transform:scale(.28)}70%,100%{transform:scale(1)}}
                  @keyframes fruit{0%,72%{opacity:0;transform:scale(.5)}100%{opacity:1;transform:scale(1)}}
                """,
            ),
            tag("rect", {"class": "sky", "width": "430", "height": "320", "rx": "18"}),
            tag("circle", {"class": "sun", "cx": "342", "cy": "62", "r": "26"}),
            tag("ellipse", {"class": "ground", "cx": "215", "cy": "300", "rx": "255", "ry": "74"}),
            tag(
                "g",
                {"class": "oak"},
                [
                    tag("path", {"class": "trunk", "d": "M199 248 C199 210 203 176 212 140 C221 176 231 211 231 248Z"}),
                    tag("path", {"class": "trunk-line", "d": "M214 238 C214 202 217 174 224 150"}),
                    tag("ellipse", {"class": "leaf-dark", "cx": "178", "cy": "124", "rx": "78", "ry": "66"}),
                    tag("ellipse", {"class": "leaf", "cx": "230", "cy": "102", "rx": "86", "ry": "78"}),
                    tag("ellipse", {"class": "leaf-hi", "cx": "276", "cy": "136", "rx": "70", "ry": "58"}),
                    tag("ellipse", {"class": "leaf", "cx": "216", "cy": "158", "rx": "98", "ry": "70"}),
                    acorn(174, 132, 0.7, "0.05s"),
                    acorn(243, 118, 0.8, "0.15s"),
                    acorn(222, 170, 0.72, "0.25s"),
                ],
            ),
        ],
    )
    OUT.write_text(svg, encoding="utf-8")
    print(OUT)


if __name__ == "__main__":
    main()
