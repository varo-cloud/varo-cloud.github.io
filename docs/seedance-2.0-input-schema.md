# Seedance 2.0 Input Schema

> 依据 [BytePlus Seedance 2.0 教程](https://docs.byteplus.com/en/docs/ModelArk/2291680)、[Prompt Guide](https://docs.byteplus.com/en/docs/ModelArk/2222480)、[Video Generation API](https://docs.byteplus.com/en/docs/ModelArk/1520757)，以及第三方对 BytePlus ARK API 的逆向整理（教程页为 JS 渲染，正文无法直接抓取）。

本文档提供两种形态：

1. **Playground 扁平 Schema**（项目 `InputSchema` 格式，适合前端表单）
2. **BytePlus 上游原生 Schema**（`content[]` 数组，适合 `/v2` 透传）

---

## 一、Playground 扁平 Input Schema（推荐）

适用于 `dreamina-seedance-2-0-260128` / `dreamina-seedance-2-0-fast-260128`，覆盖 T2V、多模态参考、图生视频等模式。

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Seedance 2.0 Input",
  "description": "Dreamina Seedance 2.0 视频生成输入 Schema。首帧/首尾帧模式与多模态参考模式互斥。",
  "type": "object",
  "required": ["prompt"],
  "x-order-properties": [
    "prompt",
    "image",
    "last_image",
    "reference_images",
    "reference_videos",
    "reference_audios",
    "aspect_ratio",
    "resolution",
    "duration",
    "generate_audio",
    "enable_web_search",
    "watermark",
    "return_last_frame"
  ],
  "properties": {
    "prompt": {
      "type": "string",
      "description": "视频描述。建议包含：主体 + 动作 + 背景 + 运镜 + 音效/对白。可在文中用 @image1/@video1/@audio1 引用参考素材（按各类型在数组中的顺序编号）。",
      "maxLength": 1000,
      "x-ui-component": "textarea",
      "x-constraints": {
        "max_chinese_chars": 500,
        "max_english_words": 1000
      }
    },
    "image": {
      "type": "string",
      "format": "uri",
      "description": "首帧图片 URL（图生视频模式）。与 reference_images 互斥。",
      "x-ui-component": "image-uploader",
      "x-ui-component-props": { "accept": "image/jpeg,image/png,image/webp" },
      "x-constraints": {
        "max_size_mb": 30,
        "formats": ["jpeg", "png", "webp"]
      }
    },
    "last_image": {
      "type": "string",
      "format": "uri",
      "description": "尾帧图片 URL（首尾帧图生视频）。需同时提供 image。与 reference_images 互斥。",
      "x-ui-component": "image-uploader",
      "x-ui-component-props": { "accept": "image/jpeg,image/png,image/webp" },
      "x-constraints": {
        "max_size_mb": 30,
        "formats": ["jpeg", "png", "webp"]
      }
    },
    "reference_images": {
      "type": "array",
      "description": "参考图片列表（多模态参考/视频编辑模式）。最多 9 张。与 image/last_image 互斥。",
      "items": { "type": "string", "format": "uri" },
      "maxItems": 9,
      "x-ui-component": "multi-image-uploader",
      "x-ui-component-props": { "accept": "image/jpeg,image/png,image/webp" },
      "x-constraints": {
        "max_size_mb_per_file": 30,
        "formats": ["jpeg", "png", "webp"]
      }
    },
    "reference_videos": {
      "type": "array",
      "description": "参考视频列表。最多 3 个，单个 2–15 秒，总时长 ≤15 秒。",
      "items": { "type": "string", "format": "uri" },
      "maxItems": 3,
      "x-ui-component": "multi-video-uploader",
      "x-ui-component-props": { "accept": "video/mp4,video/quicktime" },
      "x-constraints": {
        "max_size_mb_per_file": 50,
        "min_duration_sec": 2,
        "max_duration_sec_per_file": 15,
        "max_total_duration_sec": 15,
        "formats": ["mp4", "mov"],
        "resolution_range": "480p–720p"
      }
    },
    "reference_audios": {
      "type": "array",
      "description": "参考音频列表。最多 3 个，总时长 ≤15 秒。不可单独使用，须至少提供 1 张参考图或 1 个参考视频。",
      "items": { "type": "string", "format": "uri" },
      "maxItems": 3,
      "x-ui-component": "multi-audio-uploader",
      "x-ui-component-props": { "accept": "audio/wav,audio/mpeg" },
      "x-constraints": {
        "max_size_mb_per_file": 15,
        "min_duration_sec": 2,
        "max_duration_sec_per_file": 15,
        "max_total_duration_sec": 15,
        "formats": ["wav", "mp3"],
        "requires_visual_anchor": true
      }
    },
    "aspect_ratio": {
      "type": "string",
      "description": "输出画幅比例。图生视频未指定时默认跟随输入图。",
      "enum": ["16:9", "9:16", "4:3", "3:4", "1:1", "21:9", "adaptive"],
      "default": "16:9",
      "x-ui-component": "select"
    },
    "resolution": {
      "type": "string",
      "description": "输出分辨率。4K 仅标准版 Seedance 2.0 支持，Fast 版不支持。",
      "enum": ["480p", "720p", "1080p", "4k"],
      "default": "720p",
      "x-ui-component": "select",
      "x-constraints": {
        "4k_only_models": ["dreamina-seedance-2-0-260128"]
      }
    },
    "duration": {
      "type": "integer",
      "description": "输出视频时长（秒）。",
      "minimum": 4,
      "maximum": 15,
      "default": 5,
      "x-ui-component": "slider"
    },
    "generate_audio": {
      "type": "boolean",
      "description": "是否生成与画面同步的原生音频（对白、音效、环境声）。开/关计费相同。",
      "default": true,
      "x-ui-component": "switch"
    },
    "enable_web_search": {
      "type": "boolean",
      "description": "开启联网搜索增强（仅纯文生视频模式可用）。",
      "default": false,
      "x-ui-component": "switch",
      "x-constraints": {
        "allowed_modes": ["text-to-video"]
      }
    },
    "watermark": {
      "type": "boolean",
      "description": "是否在输出视频添加水印。",
      "default": false,
      "x-ui-component": "switch"
    },
    "return_last_frame": {
      "type": "boolean",
      "description": "是否在响应中返回生成视频的最后一帧图片。",
      "default": false,
      "x-ui-component": "switch"
    }
  },
  "allOf": [
    {
      "if": {
        "required": ["image"]
      },
      "then": {
        "description": "图生视频模式：image 必填，与 reference_images 互斥"
      }
    },
    {
      "not": {
        "required": ["image", "reference_images"]
      },
      "description": "image/last_image 与 reference_images 不可同时使用"
    },
    {
      "if": {
        "properties": {
          "reference_audios": { "minItems": 1 }
        },
        "required": ["reference_audios"]
      },
      "then": {
        "anyOf": [
          { "required": ["reference_images"], "properties": { "reference_images": { "minItems": 1 } } },
          { "required": ["reference_videos"], "properties": { "reference_videos": { "minItems": 1 } } },
          { "required": ["image"] }
        ],
        "description": "有参考音频时，必须至少有一个视觉锚点（图或视频）"
      }
    },
    {
      "if": {
        "anyOf": [
          { "required": ["reference_images"] },
          { "required": ["reference_videos"] },
          { "required": ["image"] }
        ]
      },
      "then": {
        "properties": {
          "enable_web_search": { "const": false }
        },
        "description": "含参考素材时不可开启联网搜索"
      }
    }
  ],
  "x-output-spec": {
    "format": "mp4",
    "fps": 24,
    "color_depth": "10-bit (4K)"
  },
  "x-supported-models": [
    {
      "api_model_id": "dreamina-seedance-2-0-260128",
      "display_name": "Dreamina Seedance 2.0",
      "model_path": "bytedance/seedance-2.0/text-to-video",
      "supports_4k": true
    },
    {
      "api_model_id": "dreamina-seedance-2-0-fast-260128",
      "display_name": "Dreamina Seedance 2.0 Fast",
      "model_path": "bytedance/seedance-2.0/text-to-video-fast",
      "supports_4k": false
    }
  ],
  "x-generation-modes": {
    "text-to-video": {
      "required": ["prompt"],
      "optional": ["reference_images", "reference_videos", "reference_audios", "enable_web_search"]
    },
    "image-to-video-first-frame": {
      "required": ["prompt", "image"],
      "optional": ["last_image"],
      "mutually_exclusive_with": ["reference_images", "reference_videos", "reference_audios"]
    },
    "image-to-video-first-last-frame": {
      "required": ["prompt", "image", "last_image"],
      "mutually_exclusive_with": ["reference_images", "reference_videos", "reference_audios"]
    },
    "reference-to-video": {
      "required": ["prompt"],
      "optional": ["reference_images", "reference_videos", "reference_audios"],
      "note": "至少提供一种参考素材；纯文生视频等价于 text-to-video"
    },
    "video-editing": {
      "required": ["prompt", "reference_images", "reference_videos"],
      "min_items": { "reference_images": 1, "reference_videos": 1 }
    },
    "video-extension": {
      "required": ["prompt", "reference_videos"],
      "min_items": { "reference_videos": 1 }
    }
  }
}
```

---

## 二、BytePlus 上游原生 API Schema

对应 `POST /api/v3/content_generation/tasks`：

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "BytePlus Seedance 2.0 Create Task Request",
  "type": "object",
  "required": ["model", "content"],
  "properties": {
    "model": {
      "type": "string",
      "enum": [
        "dreamina-seedance-2-0-260128",
        "dreamina-seedance-2-0-fast-260128"
      ],
      "description": "模型 ID"
    },
    "content": {
      "type": "array",
      "description": "输入内容数组。顺序必须为：text → image_url → video_url → audio_url",
      "minItems": 1,
      "items": {
        "oneOf": [
          {
            "type": "object",
            "required": ["type", "text"],
            "properties": {
              "type": { "const": "text" },
              "text": {
                "type": "string",
                "description": "文本提示词，可在末尾追加 --resolution/--duration 等内联参数（1.x 系列习惯，2.0 推荐用顶层字段）"
              }
            }
          },
          {
            "type": "object",
            "required": ["type", "image_url"],
            "properties": {
              "type": { "const": "image_url" },
              "image_url": {
                "type": "object",
                "required": ["url"],
                "properties": {
                  "url": {
                    "type": "string",
                    "description": "图片 URL、Base64 data URI 或 asset:// 资产 ID"
                  }
                }
              },
              "role": {
                "type": "string",
                "enum": ["first_frame", "last_frame", "reference_image"],
                "description": "first_frame/last_frame 用于图生视频；reference_image 用于多模态参考/视频编辑"
              }
            }
          },
          {
            "type": "object",
            "required": ["type", "video_url"],
            "properties": {
              "type": { "const": "video_url" },
              "video_url": {
                "type": "object",
                "required": ["url"],
                "properties": {
                  "url": { "type": "string" }
                }
              },
              "role": {
                "type": "string",
                "enum": ["reference_video"],
                "default": "reference_video"
              }
            }
          },
          {
            "type": "object",
            "required": ["type", "audio_url"],
            "properties": {
              "type": { "const": "audio_url" },
              "audio_url": {
                "type": "object",
                "required": ["url"],
                "properties": {
                  "url": { "type": "string" }
                }
              },
              "role": {
                "type": "string",
                "enum": ["reference_audio"],
                "default": "reference_audio"
              }
            }
          }
        ]
      }
    },
    "resolution": {
      "type": "string",
      "enum": ["480p", "720p", "1080p", "4k"],
      "default": "720p"
    },
    "ratio": {
      "type": "string",
      "enum": ["16:9", "4:3", "1:1", "3:4", "9:16", "21:9", "adaptive"],
      "default": "adaptive",
      "description": "画幅比例（上游字段名为 ratio，Playground 扁平层映射为 aspect_ratio）"
    },
    "duration": {
      "type": "integer",
      "minimum": 4,
      "maximum": 15,
      "default": 5
    },
    "generate_audio": {
      "type": "boolean",
      "default": true
    },
    "tools": {
      "type": "array",
      "description": "工具列表。联网搜索：仅文生视频可用",
      "items": {
        "type": "object",
        "required": ["type"],
        "properties": {
          "type": { "const": "web_search" }
        }
      }
    },
    "watermark": {
      "type": "boolean",
      "default": false
    },
    "return_last_frame": {
      "type": "boolean",
      "default": false
    },
    "callback_url": {
      "type": "string",
      "format": "uri",
      "description": "任务完成回调 HTTPS URL（可选）"
    }
  }
}
```

---

## 三、字段映射表（扁平 ↔ 上游）

| Playground 扁平字段 | BytePlus 上游字段 | 说明 |
|---|---|---|
| `prompt` | `content[].type=text` | 文本提示 |
| `image` | `content[].type=image_url, role=first_frame` | 首帧图 |
| `last_image` | `content[].type=image_url, role=last_frame` | 尾帧图 |
| `reference_images[]` | `content[].type=image_url, role=reference_image` | 参考图 |
| `reference_videos[]` | `content[].type=video_url, role=reference_video` | 参考视频 |
| `reference_audios[]` | `content[].type=audio_url, role=reference_audio` | 参考音频 |
| `aspect_ratio` | `ratio` | 字段名不同 |
| `enable_web_search` | `tools: [{"type":"web_search"}]` | 仅 T2V |

---

## 四、与项目现有 Schema 的对比

`mock/schemas.ts` 里的 T2V schema 已覆盖核心字段，但还缺少：

| 缺失字段 | 说明 |
|---|---|
| `watermark` | 水印开关 |
| `return_last_frame` | 返回尾帧 |
| `aspect_ratio: "adaptive"` | 自适应画幅 |
| `image` / `last_image` | 图生视频模式（目前在 `seedance-i2v` 用的是 1.5 Pro schema） |
| 互斥约束 | 首帧模式 vs 多模态参考模式 |
| 音频必须有视觉锚点 | 业务校验规则 |

---

## 五、请求示例

### 文生视频 + 多模态参考

```json
{
  "model": "dreamina-seedance-2-0-260128",
  "prompt": "角色 @image1 在 @video1 的场景中跳舞，背景音乐使用 @audio1",
  "reference_images": ["https://example.com/character.jpg"],
  "reference_videos": ["https://example.com/scene.mp4"],
  "reference_audios": ["https://example.com/bgm.mp3"],
  "aspect_ratio": "16:9",
  "resolution": "720p",
  "duration": 8,
  "generate_audio": true
}
```

### 图生视频（首尾帧）

```json
{
  "model": "dreamina-seedance-2-0-260128",
  "prompt": "镜头缓慢推进，花瓣随风飘落",
  "image": "https://example.com/first.jpg",
  "last_image": "https://example.com/last.jpg",
  "resolution": "1080p",
  "duration": 5,
  "generate_audio": true
}
```

### BytePlus 上游原生格式（多模态参考）

```json
{
  "model": "dreamina-seedance-2-0-260128",
  "content": [
    {
      "type": "text",
      "text": "The character from @image1 dances in the scene from @video1, with @audio1 as background music"
    },
    {
      "type": "image_url",
      "image_url": { "url": "https://example.com/character.jpg" },
      "role": "reference_image"
    },
    {
      "type": "video_url",
      "video_url": { "url": "https://example.com/clip.mp4" },
      "role": "reference_video"
    },
    {
      "type": "audio_url",
      "audio_url": { "url": "https://example.com/bgm.mp3" },
      "role": "reference_audio"
    }
  ],
  "generate_audio": true,
  "ratio": "16:9",
  "resolution": "720p",
  "duration": 11
}
```

---

## 六、输出规格

| 属性 | 值 |
|---|---|
| 分辨率 | 480p, 720p, 1080p, 4k（4k 仅标准版） |
| 画幅 | 16:9, 4:3, 1:1, 3:4, 9:16, 21:9, adaptive |
| 时长 | 4–15 秒，默认 5 |
| 格式 | mp4 |
| 帧率 | 24 fps |

### 分辨率像素值参考

| 分辨率 | 16:9 | 4:3 | 1:1 | 3:4 | 9:16 | 21:9 |
|---|---|---|---|---|---|---|
| 480p | 864×496 | 752×560 | 640×640 | 560×752 | 496×864 | 992×432 |
| 720p | 1280×720 | 1112×834 | 960×960 | 834×1112 | 720×1280 | 1470×630 |
| 1080p | 1920×1080 | 1664×1248 | 1440×1440 | 1248×1664 | 1080×1920 | 2208×944 |
| 4k | 3840×2160 | 3326×2494 | 2880×2880 | 2494×3326 | 2160×3840 | 4398×1886 |

---

## 七、生成模式说明

| 模式 | 必填字段 | `role` 值 |
|---|---|---|
| 文生视频 | `prompt` | — |
| 图生视频（首帧） | `prompt` + `image` | `first_frame` 或省略 |
| 图生视频（首尾帧） | `prompt` + `image` + `last_image` | `first_frame` + `last_frame` |
| 多模态参考 | `prompt` + 参考素材 | `reference_image` / `reference_video` / `reference_audio` |
| 视频编辑 | `prompt` + 参考图 + 参考视频 | `reference_image` + `reference_video` |
| 视频延长 | `prompt` + 参考视频 | `reference_video` |

> **注意：** 首帧、首尾帧、多模态参考三种模式互斥，不可在同一请求中混用。

### Prompt 中引用素材

在 `prompt` 中可用 `@` 占位符引用 `content` 数组中的素材，按各媒体类型在数组中的顺序编号：

| 占位符 | 含义 |
|---|---|
| `@image1`, `@image2`, ... | 第 1、2、... 个 `image_url` |
| `@video1`, `@video2`, ... | 第 1、2、... 个 `video_url` |
| `@audio1`, `@audio2`, ... | 第 1、2、... 个 `audio_url` |

---

## 参考来源

- [Dreamina Seedance 2.0 series tutorial](https://docs.byteplus.com/en/docs/ModelArk/2291680)
- [Dreamina Seedance 2.0 series prompt guide](https://docs.byteplus.com/en/docs/ModelArk/2222480)
- [Seedance 2.0 API Reference - Create a video generation task](https://docs.byteplus.com/en/docs/ModelArk/1520757)
- [WaveSpeed Seedance 2.0 T2V Schema](https://wavespeed.ai/center/default/api/v1/model_schema/bytedance/seedance-2.0/text-to-video)
- [Anyfast Seedance 2.0 API Guide](https://docs.anyfast.ai/guides/model-api/bytedance/seedance-2-0)
