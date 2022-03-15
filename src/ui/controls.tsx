import { GameState } from "../game";
import { render, createElement, Fragment, Component } from "preact";
import { findTargets, getMapDescription, getVictim, XYContents } from "../map";
import { Glyphs } from "../glyphs";
import { getSoul, MonsterArchetypes } from "../monster";
import { describeSoulEffects, Soul } from "../souls";
import { maxEssence } from "../commands";

export function renderControls(
  game: GameState,
  messages: [string, string][][]
) {
  render(<Interface {...{ game, messages }} />, document.body);
}

function Interface(props: { game: GameState; messages: [string, string][][] }) {
  return (
    <div class="wrapper">
      <Playarea />
      <Sidebar game={props.game} />
      <div id="mapDanger">
        {getMapDescription() + " [Danger: " + props.game.map.danger + "]"}
      </div>
      <MessageLog messages={props.messages} />
    </div>
  );
}

class Playarea extends Component {
  shouldComponentUpdate = () => false;
  render = (props: {}) => <div id="playarea"></div>;
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
  return (
    <div id="status">
      <div class="stat">
        <div class="stat-label">Essence</div>
        <div class="stat-value" id="essence">
          {props.game.player.essence}
        </div>
        <div class="stat-label">/</div>
        <div class="stat-value" id="maxEssence">
          {maxEssence()}
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
