import { useState, useRef, useCallback, useEffect } from "react";
import { useTheme } from "./hooks/useTheme";
import "./Scoreboard.css";

function formatScore(n) {
  return n.toLocaleString();
}

const NUMPAD_KEYS = ["7", "8", "9", "4", "5", "6", "1", "2", "3", "0", "00", "⌫"];
const QUICK_ADD = [1, 5, 10];
const PRESETS = [1, 5, 10, 25];

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function ScoreEntrySheet({ player, onApply, onClose }) {
  const [entry, setEntry] = useState("");

  const pressKey = (key) => {
    if (key === "⌫") {
      setEntry((e) => e.slice(0, -1));
    } else {
      setEntry((e) => (e + key).replace(/^0+(\d)/, "$1"));
    }
  };

  const apply = (sign) => {
    const pts = parseInt(entry, 10);
    if (!entry || isNaN(pts) || pts === 0) return;
    onApply(sign * pts);
    onClose();
  };

  const setPreset = (n) => setEntry(String(n));

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="overlay" onClick={onClose} role="presentation">
      <div
        className="sheet"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
      >
        <div className="sheet-handle" aria-hidden="true" />
        <div className="sheet-title" id="sheet-title">Add points</div>
        <div className="sheet-player">{player.name}</div>

        <div className={`sheet-display${entry ? "" : " empty"}`}>
          {entry || "0"}
        </div>

        <div className="presets">
          {PRESETS.map((n) => (
            <button key={n} type="button" className="preset-btn" onClick={() => setPreset(n)}>
              {n}
            </button>
          ))}
        </div>

        <div className="numpad">
          {NUMPAD_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              className={`numpad-key${key === "⌫" ? " numpad-key-back" : ""}`}
              onClick={() => pressKey(key)}
              aria-label={key === "⌫" ? "Backspace" : key}
            >
              {key}
            </button>
          ))}
        </div>

        <div className="sheet-actions">
          <button type="button" className="sheet-action sheet-action-minus" onClick={() => apply(-1)}>
            Subtract
          </button>
          <button type="button" className="sheet-action sheet-action-plus" onClick={() => apply(1)}>
            Add
          </button>
        </div>

        <button type="button" className="sheet-close" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function Scoreboard() {
  const { theme, toggleTheme } = useTheme();
  const [players, setPlayers] = useState([
    { id: 1, name: "Player 1", score: 0 },
    { id: 2, name: "Player 2", score: 0 },
  ]);
  const [gameOver, setGameOver] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [scoreSheetPlayer, setScoreSheetPlayer] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [history, setHistory] = useState([]);
  const nextId = useRef(3);

  const pushHistory = useCallback((snapshot) => {
    setHistory((h) => [...h.slice(-19), snapshot]);
  }, []);

  const updatePlayers = useCallback((updater) => {
    setPlayers((prev) => {
      pushHistory(prev.map((p) => ({ ...p })));
      return typeof updater === "function" ? updater(prev) : updater;
    });
  }, [pushHistory]);

  const adjustScore = (id, delta) => {
    updatePlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, score: p.score + delta } : p))
    );
  };

  const undo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setPlayers(prev);
  };

  const addPlayer = () => {
    const id = nextId.current++;
    updatePlayers((prev) => [...prev, { id, name: `Player ${id}`, score: 0 }]);
  };

  const removePlayer = (id) => {
    if (players.length <= 1) return;
    updatePlayers((prev) => prev.filter((p) => p.id !== id));
    setConfirmRemove(null);
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setEditName(p.name);
  };

  const commitEdit = () => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === editingId ? { ...p, name: editName.trim() || p.name } : p))
    );
    setEditingId(null);
  };

  const resetGame = () => {
    updatePlayers((prev) => prev.map((p) => ({ ...p, score: 0 })));
    setGameOver(false);
    setHistory([]);
  };

  const endGame = () => {
    setGameOver(true);
    setScoreSheetPlayer(null);
    setEditingId(null);
  };

  const winner = gameOver
    ? players.reduce((a, b) => (b.score > a.score ? b : a))
    : null;

  const ranked = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="scoreboard">
      <header className="header">
        <div className="header-text">
          <div className="eyebrow">{gameOver ? "Final scores" : "Game in progress"}</div>
          <h1 className="title">
            <span className="title-accent">Score</span>keeper
          </h1>
        </div>
        <button
          type="button"
          className="icon-btn"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        </button>
      </header>

      {gameOver && winner && (
        <div className="winner-banner" role="status">
          <div className="winner-label">Winner</div>
          <div className="winner-name">{winner.name}</div>
          <div className="winner-score">{formatScore(winner.score)} points</div>
          <button type="button" className="btn-primary-light" onClick={resetGame}>
            Play again
          </button>
        </div>
      )}

      {!gameOver && (
        <div className="toolbar">
          <button type="button" className="toolbar-btn" onClick={undo} disabled={history.length === 0}>
            Undo
          </button>
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => {
              if (window.confirm("Reset all scores to zero?")) resetGame();
            }}
          >
            Reset scores
          </button>
        </div>
      )}

      <div className="players" role="list">
        {ranked.map((p, i) => {
          const isWinner = gameOver && winner?.id === p.id;
          return (
            <div
              key={p.id}
              className={`player-card${isWinner ? " is-winner" : ""}`}
              role="listitem"
            >
              <div className="player-top">
                <div className={`rank${i === 0 ? " rank-first" : ""}`} aria-hidden="true">
                  {i + 1}
                </div>

                <div className="player-info">
                  {editingId === p.id ? (
                    <input
                      className="player-name-input"
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitEdit();
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      aria-label="Player name"
                    />
                  ) : (
                    <button
                      type="button"
                      className="player-name"
                      onClick={() => !gameOver && startEdit(p)}
                      aria-label={`Edit name for ${p.name}`}
                    >
                      {p.name}
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  className="player-score-display"
                  onClick={() => !gameOver && setScoreSheetPlayer(p)}
                  aria-label={`${p.name} score: ${formatScore(p.score)}. Tap to enter custom amount.`}
                >
                  {formatScore(p.score)}
                </button>

                {!gameOver && players.length > 1 && (
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => setConfirmRemove(p)}
                    aria-label={`Remove ${p.name}`}
                  >
                    ✕
                  </button>
                )}
              </div>

              {!gameOver && (
                <div className="score-controls">
                  <button
                    type="button"
                    className="score-btn score-btn-minus"
                    onClick={() => adjustScore(p.id, -1)}
                    aria-label={`Subtract 1 from ${p.name}`}
                  >
                    −
                  </button>

                  <div className="quick-add">
                    {QUICK_ADD.map((n) => (
                      <button
                        key={n}
                        type="button"
                        className="quick-btn"
                        onClick={() => adjustScore(p.id, n)}
                        aria-label={`Add ${n} to ${p.name}`}
                      >
                        +{n}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="score-btn score-btn-plus"
                    onClick={() => adjustScore(p.id, 1)}
                    aria-label={`Add 1 to ${p.name}`}
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {!gameOver && (
          <button type="button" className="add-player-btn" onClick={addPlayer}>
            + Add player
          </button>
        )}
      </div>

      {!gameOver && (
        <div className="footer-actions">
          <button type="button" className="end-game-btn" onClick={endGame}>
            End game
          </button>
        </div>
      )}

      <p className="hint">
        Tap +/− for quick scoring · Tap a score for custom amounts · Tap a name to rename
      </p>

      {scoreSheetPlayer && (
        <ScoreEntrySheet
          player={scoreSheetPlayer}
          onApply={(delta) => adjustScore(scoreSheetPlayer.id, delta)}
          onClose={() => setScoreSheetPlayer(null)}
        />
      )}

      {confirmRemove && (
        <div className="confirm-dialog" role="presentation" onClick={() => setConfirmRemove(null)}>
          <div className="confirm-box" role="alertdialog" aria-labelledby="confirm-title" onClick={(e) => e.stopPropagation()}>
            <h2 className="confirm-title" id="confirm-title">Remove player?</h2>
            <p className="confirm-text">
              {confirmRemove.name} will be removed from the game.
            </p>
            <div className="confirm-actions">
              <button type="button" className="confirm-cancel" onClick={() => setConfirmRemove(null)}>
                Cancel
              </button>
              <button type="button" className="confirm-delete" onClick={() => removePlayer(confirmRemove.id)}>
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
