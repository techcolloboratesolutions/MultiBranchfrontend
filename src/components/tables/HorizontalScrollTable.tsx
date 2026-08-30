import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Box, IconButton, Paper, Stack, Typography } from "@mui/material";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";

interface Props {
  children: ReactNode;
  label?: string;
  outlined?: boolean;
}

export default function HorizontalScrollTable({
  children,
  label = "Scroll left / right",
  outlined = false,
}: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const topScrollRef = useRef<HTMLDivElement>(null);
  const syncing = useRef<"top" | "table" | null>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const [innerWidth, setInnerWidth] = useState(0);

  const refresh = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) {
      return;
    }
    setInnerWidth(el.scrollWidth);
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) {
      return;
    }
    refresh();
    const observer = new ResizeObserver(() => refresh());
    observer.observe(el);
    const table = el.querySelector("table");
    if (table) {
      observer.observe(table);
    }
    return () => observer.disconnect();
  }, [children, refresh]);

  const scrollByAmount = (delta: number) => {
    scrollerRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  };

  const onTableScroll = () => {
    const el = scrollerRef.current;
    const top = topScrollRef.current;
    if (!el) {
      return;
    }
    refresh();
    if (syncing.current === "top") {
      syncing.current = null;
      return;
    }
    if (top) {
      syncing.current = "table";
      top.scrollLeft = el.scrollLeft;
    }
  };

  const onTopScroll = () => {
    const el = scrollerRef.current;
    const top = topScrollRef.current;
    if (!el || !top) {
      return;
    }
    if (syncing.current === "table") {
      syncing.current = null;
      return;
    }
    syncing.current = "top";
    el.scrollLeft = top.scrollLeft;
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <IconButton
          size="small"
          onClick={() => scrollByAmount(-320)}
          disabled={!canLeft}
          aria-label="Scroll table left"
          sx={{ border: "1px solid", borderColor: "divider" }}
        >
          <ChevronLeftIcon />
        </IconButton>
        <Typography variant="body2" color="text.secondary" sx={{ flex: 1, fontWeight: 600 }}>
          {label}
        </Typography>
        <IconButton
          size="small"
          onClick={() => scrollByAmount(320)}
          disabled={!canRight}
          aria-label="Scroll table right"
          sx={{ border: "1px solid", borderColor: "divider" }}
        >
          <ChevronRightIcon />
        </IconButton>
      </Stack>
      <Box
        ref={topScrollRef}
        onScroll={onTopScroll}
        sx={{
          overflowX: "auto",
          overflowY: "hidden",
          mb: 0.5,
          "&::-webkit-scrollbar": { height: 10 },
          "&::-webkit-scrollbar-thumb": { bgcolor: "rgba(15,61,76,0.35)", borderRadius: 8 },
        }}
      >
        <Box sx={{ width: innerWidth || "100%", height: 1 }} />
      </Box>
      <Paper variant={outlined ? "outlined" : undefined}>
        <Box
          ref={scrollerRef}
          onScroll={onTableScroll}
          sx={{
            overflowX: "auto",
            "&::-webkit-scrollbar": { height: 10 },
            "&::-webkit-scrollbar-thumb": { bgcolor: "rgba(15,61,76,0.35)", borderRadius: 8 },
          }}
        >
          {children}
        </Box>
      </Paper>
    </Box>
  );
}
