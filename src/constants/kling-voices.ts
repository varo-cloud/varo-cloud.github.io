export type KlingVoiceOption = {
  label: string
  value: string
}

/** Kling TTS voice IDs (kling-lipsync schema). */
export const KLING_VOICE_OPTIONS: KlingVoiceOption[] = [
  { value: 'genshin_vindi2', label: 'Genshin — Vindi' },
  { value: 'zhinen_xuesheng', label: '稚嫩学生' },
  { value: 'AOT', label: 'AOT' },
  { value: 'ai_shatang', label: 'AI 沙糖' },
  { value: 'genshin_klee2', label: 'Genshin — Klee' },
  { value: 'genshin_kirara', label: 'Genshin — Kirara' },
  { value: 'ai_kaiya', label: 'AI 凯亚' },
  { value: 'oversea_male1', label: 'Oversea Male' },
  { value: 'ai_chenjiahao_712', label: 'AI 陈家豪' },
  { value: 'girlfriend_4_speech02', label: 'Girlfriend 4' },
  { value: 'chat1_female_new-3', label: 'Chat Female' },
  { value: 'chat_0407_5-1', label: 'Chat 0407' },
  { value: 'cartoon-boy-07', label: 'Cartoon Boy' },
  { value: 'uk_boy1', label: 'UK Boy' },
  { value: 'cartoon-girl-01', label: 'Cartoon Girl' },
  { value: 'PeppaPig_platform', label: 'Peppa Pig' },
  { value: 'ai_huangzhong_712', label: 'AI 黄忠' },
  { value: 'ai_huangyaoshi_712', label: 'AI 黄药师' },
  { value: 'ai_laoguowang_712', label: 'AI 老国王' },
  { value: 'chengshu_jiejie', label: '成熟姐姐' },
  { value: 'you_pingjing', label: '优平静' },
  { value: 'calm_story1', label: 'Calm Story' },
  { value: 'uk_man2', label: 'UK Man' },
  { value: 'laopopo_speech02', label: '老婆婆' },
  { value: 'heainainai_speech02', label: '和蔼奶奶' },
]

export const DEFAULT_KLING_VOICE_ID = 'genshin_klee2'

export function resolveKlingVoiceOptions(
  enumValues?: (string | number)[],
): KlingVoiceOption[] {
  if (!enumValues?.length) return KLING_VOICE_OPTIONS

  const known = new Map(KLING_VOICE_OPTIONS.map((item) => [item.value, item.label]))
  return enumValues.map((value) => {
    const id = String(value)
    return { value: id, label: known.get(id) ?? id }
  })
}
