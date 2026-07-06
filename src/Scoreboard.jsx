import { useState, useRef, useCallback, useEffect } from "react";
import { RotateCcw, Undo2 } from "lucide-react";
import { THEMES, getStoredTheme, setTheme } from "./theme.js";
import "./Scoreboard.css";

function formatScore(n) {
  return n.toLocaleString();
}

const NUMPAD_KEYS = ["7", "8", "9", "4", "5", "6", "1", "2", "3", "0", "00", "⌫"];
const PRESETS = [1, 5, 10, 25];

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
  const [activeTheme, setActiveTheme] = useState(() => getStoredTheme());
  const nextId = useRef(3);

  const handleThemeChange = (theme) => {
    setActiveTheme(setTheme(theme));
  };

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
          <h1 className="title">
            {activeTheme === "scifi" ? (
              <>
                <span className="title-accent">◈</span>{" "}
                <span className="title-accent">Score</span>keeper
              </>
            ) : (
              <>
                🎃 <span className="title-accent">Score</span>keeper
              </>
            )}
          </h1>
        </div>
        <div className="theme-switcher" role="group" aria-label="Theme">
          {Object.entries(THEMES).map(([id, { label }]) => (
            <button
              key={id}
              type="button"
              className={`theme-switcher-btn${activeTheme === id ? " is-active" : ""}`}
              onClick={() => handleThemeChange(id)}
              aria-pressed={activeTheme === id}
            >
              {label}
            </button>
          ))}
        </div>
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

      <div className="players" role="list">
        {ranked.map((p) => {
          const isWinner = gameOver && winner?.id === p.id;
          return (
            <div
              key={p.id}
              className={`player-card${isWinner ? " is-winner" : ""}`}
              role="listitem"
            >
              <div className="player-top">
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
                  disabled={gameOver}
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
        <div className="icon-actions">
          <button
            type="button"
            className="icon-action-btn"
            onClick={undo}
            disabled={history.length === 0}
            aria-label="Undo last change"
          >
            <Undo2 size={16} strokeWidth={2} />
          </button>
          <button
            type="button"
            className="icon-action-btn"
            onClick={() => {
              if (window.confirm("Reset all scores to zero?")) resetGame();
            }}
            aria-label="Reset all scores"
          >
            <RotateCcw size={16} strokeWidth={2} />
          </button>
        </div>
      )}

      {!gameOver && (
        <div className="footer-actions">
          <button type="button" className="end-game-btn" onClick={endGame}>
            End game
          </button>
        </div>
      )}

      <p className="hint">
        Tap a score to enter points · Tap a name to rename
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
