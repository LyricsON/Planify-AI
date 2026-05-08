<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })
const { get } = useApi()

const plans = [
  { id:'free', name:'Free', price:0, period:'forever', features:['5 AI summaries/month','10 flashcard sets','Basic schedule','1 GB storage'], cta:'Current Plan', current:true },
  { id:'student', name:'Student', price:9, period:'/month', features:['Unlimited AI summaries','Unlimited flashcards','Smart schedule with AI','10 GB storage','Priority support'], cta:'Upgrade', current:false, popular:true },
  { id:'pro', name:'Pro', price:19, period:'/month', features:['Everything in Student','Advanced analytics','Custom AI tutor','50 GB storage','API access'], cta:'Upgrade', current:false }
]

const tokens = ref(250)
const tokenPacks = [
  { amount:500, price:4.99 }, { amount:1000, price:8.99 }, { amount:2500, price:19.99 }
]

const billing = ref<any[]>([])
async function load() {
  const r = await get<any>('/auth/billing-history')
  if (r.success) billing.value = Array.isArray(r.data)?r.data:r.data?.data||[]
}
onMounted(load)
</script>

<template>
  <section class="max-w-[1000px] mx-auto pb-10">
    <div class="mb-6">
      <h1 class="text-[24px] font-bold" style="color:var(--color-text)">Billing & Subscription</h1>
      <p class="text-[13px] mt-0.5" style="color:var(--color-text-muted)">Manage your plan, tokens and billing history.</p>
    </div>

    <div class="flex flex-col gap-6">
      <!-- Plans -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div v-for="p in plans" :key="p.id" class="relative p-5 flex flex-col" :style="p.popular?'border-radius:16px;background:color-mix(in srgb,var(--color-primary) 5%,var(--color-surface));border:2px solid var(--color-primary);box-shadow:var(--shadow-card)':'border-radius:16px;background:var(--color-surface);border:1px solid var(--color-border);box-shadow:var(--shadow-card)'">
          <div v-if="p.popular" class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 text-[11px] font-bold text-white" style="border-radius:99px;background:var(--color-primary)">Most Popular</div>
          <h3 class="text-[16px] font-bold mb-1" style="color:var(--color-text)">{{ p.name }}</h3>
          <div class="flex items-baseline gap-1 mb-4">
            <span class="text-[28px] font-bold" style="color:var(--color-text)">${{ p.price }}</span>
            <span class="text-[13px]" style="color:var(--color-text-muted)">{{ p.period }}</span>
          </div>
          <ul class="space-y-2 mb-6 flex-1">
            <li v-for="f in p.features" :key="f" class="flex items-center gap-2 text-[13px]" style="color:var(--color-text-soft)">
              <UIcon name="i-lucide-check" class="size-3.5 flex-shrink-0" style="color:var(--color-success)" />{{ f }}
            </li>
          </ul>
          <button class="w-full py-2.5 text-[13px] font-bold transition" :style="p.current?'border-radius:10px;background:var(--color-border);color:var(--color-text-muted);cursor:default':p.popular?'border-radius:10px;background:var(--color-primary);color:#fff':'border-radius:10px;border:1.5px solid var(--color-primary);color:var(--color-primary)'">
            {{ p.cta }}
          </button>
        </div>
      </div>

      <!-- Tokens -->
      <div class="p-6" style="border-radius:16px;background:var(--color-surface);border:1px solid var(--color-border);box-shadow:var(--shadow-card)">
        <div class="flex items-center justify-between mb-5">
          <div>
            <h2 class="text-[15px] font-bold" style="color:var(--color-text)">AI Tokens</h2>
            <p class="text-[13px] mt-0.5" style="color:var(--color-text-muted)">Used for AI summaries, flashcards and assistant chats.</p>
          </div>
          <div class="text-center px-5 py-2" style="border-radius:10px;background:color-mix(in srgb,var(--color-primary) 10%,transparent)">
            <p class="text-[26px] font-bold" style="color:var(--color-primary)">{{ tokens }}</p>
            <p class="text-[11px] font-semibold" style="color:var(--color-primary)">tokens left</p>
          </div>
        </div>
        <div class="grid grid-cols-3 gap-3">
          <button v-for="t in tokenPacks" :key="t.amount" class="p-4 flex flex-col items-center gap-1 transition" style="border-radius:12px;border:1px solid var(--color-border)">
            <p class="text-[18px] font-bold" style="color:var(--color-text)">{{ t.amount }}</p>
            <p class="text-[11px]" style="color:var(--color-text-muted)">tokens</p>
            <p class="text-[13px] font-bold mt-1" style="color:var(--color-primary)">${{ t.price }}</p>
          </button>
        </div>
        <button class="mt-4 w-full py-2.5 text-[13px] font-bold text-white transition" style="border-radius:10px;background:var(--color-primary)">Buy Tokens →</button>
      </div>

      <!-- Billing history -->
      <div class="p-6" style="border-radius:16px;background:var(--color-surface);border:1px solid var(--color-border);box-shadow:var(--shadow-card)">
        <h2 class="text-[15px] font-bold mb-4" style="color:var(--color-text)">Billing History</h2>
        <div v-if="!billing.length" class="flex flex-col items-center py-10" style="color:var(--color-text-muted)">
          <UIcon name="i-lucide-receipt" class="size-10 opacity-30 mb-3" />
          <p class="text-[14px]">No billing history yet.</p>
        </div>
        <table v-else class="w-full text-[13px]">
          <thead>
            <tr class="border-b" style="border-color:var(--color-border)">
              <th class="text-left py-2 font-bold" style="color:var(--color-text-muted)">Date</th>
              <th class="text-left py-2 font-bold" style="color:var(--color-text-muted)">Description</th>
              <th class="text-right py-2 font-bold" style="color:var(--color-text-muted)">Amount</th>
              <th class="text-right py-2 font-bold" style="color:var(--color-text-muted)">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="b in billing" :key="b._id" class="border-b" style="border-color:var(--color-border)">
              <td class="py-3" style="color:var(--color-text-muted)">{{ new Date(b.date).toLocaleDateString('en-GB') }}</td>
              <td class="py-3" style="color:var(--color-text)">{{ b.description }}</td>
              <td class="py-3 text-right font-bold" style="color:var(--color-text)">${{ b.amount }}</td>
              <td class="py-3 text-right"><span class="text-[11px] font-bold px-2 py-0.5" style="border-radius:5px;background:#f0fdf4;color:#22c55e">{{ b.status }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>