import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

export const HINT_HIDE_MS = 4000;

type Source = "hover" | "focus" | "touch";

export function Hint({
  text,
  placement = "below",
  children,
}: {
  text: string;
  placement?: "above" | "below";
  children: ReactNode;
}) {
  const id = useId();
  const hostRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const sourceRef = useRef<Source>("hover");
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState<Source>("hover");
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  function close() {
    sourceRef.current = "hover";
    setOpen(false);
    setPos(null);
  }

  function show(next: Source) {
    if (next === "hover" && window.matchMedia("(hover: none)").matches) return;
    if (sourceRef.current === "touch" && next === "hover") return;
    sourceRef.current = next;
    setSource(next);
    setOpen(true);
  }

  function place() {
    const host = hostRef.current;
    const bubble = bubbleRef.current;
    if (!host || !bubble) return;
    const a = host.getBoundingClientRect();
    const b = bubble.getBoundingClientRect();
    const margin = 8;
    const below = a.bottom + margin;
    const above = a.top - b.height - margin;
    let top =
      placement === "above"
        ? above < margin
          ? below
          : above
        : below + b.height > window.innerHeight - margin
          ? Math.max(margin, above)
          : below;
    let left = a.left + a.width / 2 - b.width / 2;
    left = Math.min(Math.max(margin, left), window.innerWidth - b.width - margin);
    setPos({ top, left });
  }

  useLayoutEffect(() => {
    if (open) place();
  }, [open, text, placement]);

  useEffect(() => {
    if (!open) return;
    const hide = () => close();
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    window.addEventListener("keydown", onKey);
    const timer =
      source === "hover" ? undefined : window.setTimeout(hide, HINT_HIDE_MS);
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") hide();
    }
    return () => {
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide);
      window.removeEventListener("keydown", onKey);
      if (timer) window.clearTimeout(timer);
    };
  }, [open, source]);

  return (
    <div
      ref={hostRef}
      className={placement === "above" ? "hint-host hint-label" : "hint-host"}
      onMouseOver={() => show("hover")}
      onMouseOut={(e) => {
        if (sourceRef.current !== "hover") return;
        const next = e.relatedTarget;
        if (next instanceof Node && hostRef.current?.contains(next)) return;
        close();
      }}
      onFocus={() => show("focus")}
      onBlur={() => close()}
      onPointerDown={(e) => {
        if (e.pointerType === "touch") show("touch");
      }}
    >
      {children}
      <span id={id} className="visually-hidden">
        {text}
      </span>
      {open
        ? createPortal(
            <div
              ref={bubbleRef}
              role="tooltip"
              className="hint-bubble"
              style={
                pos
                  ? { top: pos.top, left: pos.left }
                  : { visibility: "hidden", top: 0, left: 0 }
              }
            >
              {text}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
