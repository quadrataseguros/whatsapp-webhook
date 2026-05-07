#!/usr/bin/env node
/**
 * Quadrata Seguros — CLI do Criador de Posts de Seguro de Vida
 *
 * Uso:
 *   node life-insurance/post-creator.js --tipo carrossel --persona provedor
 *   node life-insurance/post-creator.js --tipo reels --tema "5 mitos sobre seguro de vida"
 *   node life-insurance/post-creator.js --calendario
 *   node life-insurance/post-creator.js --ab-test --tipo reels --tema "seguro de vida para autônomos"
 *   node life-insurance/post-creator.js --lista
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const { generatePost, generateMonthlyCalendar, generateABVariants, POST_TYPES, PERSONA_IDS } =
  require("./generator");

const args = process.argv.slice(2);

function parseArgs(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i].replace(/^--/, "");
    const next = argv[i + 1];
    if (next && !next.startsWith("--")) {
      opts[key] = next;
      i++;
    } else {
      opts[key] = true;
    }
  }
  return opts;
}

function printSeparator(label = "") {
  const line = "─".repeat(60);
  if (label) console.log(`\n${line}\n  ${label}\n${line}`);
  else console.log(`\n${line}`);
}

function printJson(obj) {
  console.log(JSON.stringify(obj, null, 2));
}

async function main() {
  const opts = parseArgs(args);

  // ── Lista de opções disponíveis ──────────────────────────────────────────
  if (opts.lista || opts.help) {
    console.log("\n🛡️  QUADRATA SEGUROS — Criador de Posts: Seguro de Vida\n");

    console.log("TIPOS DE POST (--tipo):");
    Object.entries(POST_TYPES).forEach(([id, t]) => {
      console.log(`  ${id.padEnd(20)} ${t.label}`);
    });

    console.log("\nPERSONAS (--persona):");
    Object.entries(PERSONA_IDS).forEach(([id, p]) => {
      console.log(`  ${id.padEnd(20)} ${p.nome}`);
    });

    console.log("\nPILARES (--pilar):");
    console.log("  educacao             Educação e Desmistificação (40%)");
    console.log("  emocao               Histórias e Gatilhos Emocionais (25%)");
    console.log("  autoridade           Prova Social e Autoridade (20%)");
    console.log("  conversao            Conversão e CTA (15%)");

    console.log("\nEXEMPLOS:");
    console.log("  node life-insurance/post-creator.js --tipo carrossel --persona provedor --pilar educacao");
    console.log("  node life-insurance/post-creator.js --tipo reels --tema \"5 mitos sobre seguro de vida\"");
    console.log("  node life-insurance/post-creator.js --calendario");
    console.log("  node life-insurance/post-creator.js --ab-test --tipo reels");
    return;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("❌ ANTHROPIC_API_KEY não encontrada. Adicione no arquivo .env");
    process.exit(1);
  }

  // ── Geração de calendário mensal ─────────────────────────────────────────
  if (opts.calendario) {
    printSeparator("Gerando calendário mensal de conteúdo...");
    console.log("⏳ Isso pode levar 15-30 segundos...\n");

    const calendar = await generateMonthlyCalendar();
    const filename = `calendario-${Date.now()}.json`;
    const fs = require("fs");
    const path = require("path");
    const outPath = path.join(__dirname, "output", filename);
    fs.mkdirSync(path.join(__dirname, "output"), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(calendar, null, 2));

    console.log("✅ Calendário gerado!\n");
    if (calendar.calendario && Array.isArray(calendar.calendario)) {
      console.log(`📅 Total de posts: ${calendar.total_posts || calendar.calendario.length}`);
      console.log("\nPrimeiros 5 posts:");
      calendar.calendario.slice(0, 5).forEach((p) => {
        console.log(`  ${p.data} | ${p.formato.padEnd(15)} | ${p.pilar.padEnd(12)} | ${p.tema}`);
      });
      console.log(`\n📁 Arquivo completo salvo em: life-insurance/output/${filename}`);
    } else {
      printJson(calendar);
    }
    return;
  }

  // ── Teste A/B ────────────────────────────────────────────────────────────
  if (opts["ab-test"]) {
    const tipo = opts.tipo || "reels";
    const tema = opts.tema || null;
    const persona_id = opts.persona || "provedor";

    printSeparator(`Gerando variantes A/B — ${tipo.toUpperCase()}`);
    console.log("⏳ Gerando 2 variantes em paralelo...\n");

    const result = await generateABVariants({ tipo, tema, persona_id });
    const fs = require("fs");
    const path = require("path");
    const filename = `ab-test-${tipo}-${Date.now()}.json`;
    const outPath = path.join(__dirname, "output", filename);
    fs.mkdirSync(path.join(__dirname, "output"), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(result, null, 2));

    console.log(`✅ Variantes A/B geradas e salvas em: life-insurance/output/${filename}\n`);
    console.log(`TEMA: ${result.tema || "Gerado automaticamente"}`);
    console.log(`\n📋 ${result.instrucao_teste}`);
    return;
  }

  // ── Geração de post único ────────────────────────────────────────────────
  const tipo = opts.tipo || "carrossel";
  const persona_id = opts.persona || "provedor";
  const pilar = opts.pilar || "educacao";
  const tema = opts.tema || null;
  const contexto = opts.contexto || "";

  printSeparator(`Gerando ${POST_TYPES[tipo]?.label || tipo} — Quadrata Seguros`);
  console.log(`👤 Persona: ${PERSONA_IDS[persona_id]?.nome || persona_id}`);
  console.log(`📌 Pilar: ${pilar}`);
  if (tema) console.log(`💡 Tema: ${tema}`);
  console.log("\n⏳ Gerando conteúdo...\n");

  const result = await generatePost({ tipo, persona_id, pilar, tema, contexto_adicional: contexto });

  const fs = require("fs");
  const path = require("path");
  const filename = `post-${tipo}-${Date.now()}.json`;
  const outPath = path.join(__dirname, "output", filename);
  fs.mkdirSync(path.join(__dirname, "output"), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));

  console.log("✅ Post gerado com sucesso!\n");
  console.log(`📊 Tokens usados: input=${result.meta.tokens_usados?.input_tokens} | output=${result.meta.tokens_usados?.output_tokens}`);
  console.log(`📁 Salvo em: life-insurance/output/${filename}`);

  printSeparator("CONTEÚDO GERADO");
  printJson(result.conteudo);
}

main().catch((err) => {
  console.error("❌ Erro:", err.message);
  if (process.env.DEBUG) console.error(err.stack);
  process.exit(1);
});
