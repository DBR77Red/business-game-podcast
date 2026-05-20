import { Hono } from 'hono'

export const storyRoute = new Hono()

const config = {
  episodeTitle: 'Business Game Podcast',
  hostVoiceId: process.env.HOST_VOICE_ID ?? 'onwK4e9ZLuTAKqWW03F9',
  participant: {
    name: 'Marco',
    voiceId: process.env.PARTICIPANT_VOICE_ID ?? '21m00Tcm4TlvDq8ikWAM',
    problemDescription: {
      en: `My name is Marco and I run a small digital marketing agency with eight people. We have been growing steadily but our biggest problem is client churn. We sign clients on three-month contracts but about forty percent do not renew. I believe we are delivering results but clients do not seem to see the value. I need help figuring out how to retain them.`,
      pt: `Meu nome é Marco e eu administro uma pequena agência de marketing digital com oito pessoas. Temos crescido de forma consistente, mas nosso maior problema é a retenção de clientes. Fechamos contratos de três meses, mas cerca de quarenta por cento dos clientes não renovam. Acredito que estamos entregando resultados, mas os clientes parecem não enxergar o valor. Preciso de ajuda para descobrir como retê-los.`,
    },
    replyTexts: {
      en: {
        'breakout': `Hi, this is Marco. I wanted to write back with an update. I followed the framework our guest laid out — the monthly value reports, the success metrics we agreed on at onboarding, and the quarterly business reviews. Within six weeks our churn dropped from forty percent to twelve percent. Two clients actually upgraded their packages. The episode went viral in a few marketing groups and I have had five referrals from it. I cannot thank you enough. This changed the trajectory of my business.`,
        'solid-win': `Hello, this is Marco. Quick update on the advice from the episode. I implemented most of what was suggested — the reporting cadence took some time to set up but once it was running, clients started engaging much more. After two months our renewal rate improved from sixty to seventy-eight percent. Still work to do but the direction is clearly right. Appreciate the clarity and the practical steps.`,
        'partial': `This is Marco. I wanted to give you an honest update. I tried to follow the advice but some of it was a bit general for my situation. I set up the reporting but clients did not respond as expected. I ended up pivoting to a different approach. Churn is down a little but I am still figuring out the right system.`,
        'setback': `Hi, this is Marco. I appreciate the guest's time on the episode. I followed the advice as best I could but the plan was not specific enough for my situation. I am still struggling with churn. No hard feelings — just being honest.`,
      },
      pt: {
        'breakout': `Oi, é o Marco. Queria escrever com uma atualização. Segui exatamente o que o convidado sugeriu — os relatórios mensais de valor, as métricas de sucesso definidas no onboarding, e as revisões trimestrais. Em seis semanas, nossa taxa de churn caiu de quarenta para doze por cento. Dois clientes inclusive subiram de pacote. O episódio viralizou em alguns grupos de marketing e já tive cinco indicações. Não consigo agradecer o suficiente. Isso mudou a trajetória do meu negócio.`,
        'solid-win': `Olá, aqui é o Marco. Atualização rápida sobre o conselho do episódio. Implementei a maior parte do que foi sugerido — a cadência de relatórios deu algum trabalho pra montar, mas uma vez no ar, os clientes se engajaram muito mais. Em dois meses, nossa taxa de renovação subiu de sessenta para setenta e oito por cento. Ainda tem trabalho a fazer, mas a direção tá certa. Agradeço a clareza e os passos práticos.`,
        'partial': `Aqui é o Marco. Queria dar uma atualização honesta. Tentei seguir o conselho, mas algumas partes eram genéricas demais pra minha situação. Montei os relatórios, mas os clientes não responderam como esperado. Acabei mudando de abordagem. O churn caiu um pouco, mas ainda tô procurando o sistema certo.`,
        'setback': `Oi, é o Marco. Agradeço o tempo do convidado no episódio. Segui o conselho como pude, mas o plano não era específico o bastante pra minha situação. Ainda tô lutando com o churn. Sem ressentimentos — só sendo honesto.`,
      },
    },
  },
  scoringThresholds: {
    breakout: 80,
    solidWin: 60,
    partial: 40,
  },
} as const

storyRoute.get('/', (c) => c.json(config))
