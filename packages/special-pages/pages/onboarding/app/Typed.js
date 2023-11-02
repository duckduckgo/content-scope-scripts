import { h } from "preact";
import { useState, useEffect, useRef } from "preact/hooks";

const isReducedMotion =
  // @ts-ignore
  window.matchMedia(`(prefers-reduced-motion: reduce)`) === true ||
  window.matchMedia(`(prefers-reduced-motion: reduce)`).matches === true;

export function Typed({ text, onComplete = null, delay = 20 }) {
  return (
    <TypedInner key={text} text={text} onComplete={onComplete} delay={delay} />
  );
}

function TypedInner({ text, onComplete, delay }) {
  // TODO test isReducedMotion
  const [screenWidth, setScreenWidth] = useState(0)
  const [coords, setCoords] = useState({left: 0, width: 0});

  const [currentText, setCurrentText] = useState(isReducedMotion ? text : "");
  const [currentIndex, setCurrentIndex] = useState(
    isReducedMotion ? text.length : 0
  );

  const actual = useRef(null);
  const overlay = useRef(null);

  useEffect(() => {
    const handler = () => {
      setScreenWidth(window.innerWidth);
  }

    window.addEventListener("resize", handler);
  return () => {
      window.removeEventListener("resize", handler)
  }
  }, [])

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setCurrentText((prevText) => prevText + text[currentIndex]);
        setCurrentIndex((prevIndex) => prevIndex + 1);
      }, delay);

      return () => clearTimeout(timeout);
    } else {
      onComplete && onComplete();
      return () => {};
    }
  }, [currentIndex, delay, text]);

  useEffect(() => {
    setCoords({
      // @ts-ignore
      left: actual.current.getBoundingClientRect().left - overlay.current.parentElement.getBoundingClientRect().left,
      // @ts-ignore
      width: actual.current.getBoundingClientRect().width
    });
  }, [screenWidth]);

  return (
    <div
      style={{ position: "relative", width: "100%", whiteSpace: "pre-line" }}
      aria-label={text}
    >
      <span style={{ visibility: "hidden" }} ref={actual}>
        {text}
      </span>
      <span
        ref={overlay}
        aria-hidden={false}
        style={{
          position: "absolute",
          top: 0,
          left: coords.left,
          width: coords.width,
          whiteSpace: "pre-line",
        }}
      >
        {currentText}
      </span>
    </div>
  );
}