import { Game, GameState } from "../game";
import { render, createElement, Fragment, Component } from "preact";
import { findTargets, getMapDescription, getVictim, XYContents } from "../map";
import { Glyphs } from "../glyphs";
import { getSoul, MonsterArchetypes } from "../monster";
import { describeSoulEffects, Soul } from "../souls";
import { maxEssence } from "../commands";
import { UI, UIState } from "../ui";

export function renderControls(
  game: GameState,
  ui: UIState,
  messages: [string, string][][]
) {
  render(<Interface {...{ game, ui, messages }} />, document.body);
}

function Interface(props: {
  game: GameState;
  ui: UIState;
  messages: [string, string][][];
}) {
  return (
    <div class="wrapper">
      <Playarea />
      <Sidebar game={props.game} />
      <div id="mapDanger">
        {getMapDescription() + " [Danger: " + props.game.map.danger + "]"}
      </div>
      {props.ui.activeChoice ? (
        <ChoiceBox ui={props.ui} />
      ) : (
        <MessageLog messages={props.messages} />
      )}
    </div>
  );
}

class Playarea extends Component {
  shouldComponentUpdate = () => false;
  render = (props: {}) => <div id="playarea"></div>;
}

function ChoiceBox(props: { ui: UIState }) {
  let choice = props.ui.activeChoice;
  if (!choice) {
    return null;
  }
  return (
    <div id="choiceBox">
      <div class="prompt">{choice.prompt}</div>
      <div class="opts">
        {Array.from(choice.opts, ([key, item]) => (
          <Fragment key={key}>
            <div class="choice-key">{key}</div>
            <div class="choice-item">{item}</div>
          </Fragment>
        ))}
        <div class="choice-key">ESC</div>
        <div class="choice-item">Cancel</div>
      </div>
    </div>
  );
}

function Sidebar(props: { game: GameState }) {
  const game = props.game;
  return (
    <div id="sidebar">
      <h1>SOUL 👻 BREAK 💀 FAST</h1>
      <StatusView game={game} />
      <div class="sidebar-section">
        <h2>On Ground</h2>
        <WhatsHereView here={getVictim()} />
      </div>
      <div class="sidebar-section">
        <h2>Souls</h2>
        <SoulListView souls={game.player.soulSlots.generic} />
      </div>
      <div class="sidebar-section">
        <h2>Targets</h2>
        <div id="targets">
          {findTargets().map((c) => {
            if (c.monster) {
              let arch = MonsterArchetypes[c.monster.archetype];
              let glyph = Glyphs[arch.glyph];
              let name = arch.name;
              if (c.monster.dying) {
                name += " (dying)";
              } else if (arch.soul == "vermin") {
                name += " (vermin)";
              } else if (c.monster.hp === c.monster.maxHP) {
                name += " (unharmed)";
              } else if (c.monster.hp < c.monster.maxHP / 2) {
                name += " (heavily wounded)";
              } else {
                name += " (slightly wounded)";
              }
              let desc = arch.description;
              return (
                <div class="target-entry">
                  <div class="target-glyph soul-glyph">{glyph}</div>
                  <div class="target-name soul-name">{name}</div>
                  <div class="target-thoughts">{desc}</div>
                </div>
              );
            }
          })}
        </div>
      </div>
    </div>
  );
}

function StatusView(props: { game: GameState }) {
  let full = "rgba(0, 108, 139, 1)";
  let lost = "rgba(193, 46, 46, 1)";
  let empty = "rgba(94, 94, 94, 1)";
  let essencePct = Math.floor((props.game.player.essence / maxEssence()) * 100);
  let gradient = `background: linear-gradient(90deg, ${full} 0%, ${full} ${essencePct}%, ${empty} ${essencePct}%, ${empty} ${essencePct}%);`;
  return (
    <div id="status">
      <div class="stat">
        <div class="stat-label">Essence</div>
        <div class="stat-value" id="essence" style={gradient}>
          {props.game.player.essence} / {maxEssence()}
        </div>
      </div>
      <div class="stat">
        <div class="stat-label">Turns</div>
        <div class="stat-value" id="turns">
          {props.game.turns}
        </div>
      </div>
    </div>
  );
}

export function WhatsHereView(props: { here: XYContents }) {
  const here = props.here;
  let glyph = "";
  let what = "";
  let desc = "";
  if (here.monster) {
    let soul = getSoul(here.monster);
    glyph = Glyphs[soul.glyph];
    what = soul.name;
    desc = describeSoulEffects(soul);
  } else if (here.tile) {
    glyph = Glyphs[here.tile.glyph];
    what = here.tile.glyph;
    if (here.exitDanger) {
      desc = "Danger: " + here.exitDanger;
    }
  }
  return (
    <div id="whatsHere">
      <div class="soul-glyph" id="hereGlyph">
        {glyph}
      </div>
      <div class="soul-name" id="hereWhat">
        {what}
      </div>
      <div class="soul-effect" id="hereDescription">
        {desc}
      </div>
    </div>
  );
}

function SoulListView(props: { souls: Array<Soul> }) {
  return (
    <div id="souls">
      {...props.souls.map((soul) => <SoulView soul={soul} />)}
    </div>
  );
}

function SoulView(props: { soul: Soul }) {
  return (
    <Fragment key={props.soul.name}>
      <div class="soul-glyph">{Glyphs[props.soul.glyph]}</div>
      <div class="soul-name">{props.soul.name}</div>
      <div class="soul-effect">{describeSoulEffects(props.soul)}</div>
    </Fragment>
  );
}

function MessageLog(props: { messages: [string, string][][] }) {
  let entries = props.messages
    .map((msgs, i) => {
      let log = msgs.map(([msg, msgType], i) => (
        <span class={"msg-" + msgType}>{msg + " "}</span>
      ));
      return <li key={"mgs-turn-" + i}>{...log}</li>;
    })
    .reverse();
  return (
    <div id="messages">
      <ul class="messageLog">{...entries}</ul>
    </div>
  );
}
