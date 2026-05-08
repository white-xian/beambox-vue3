/** AI 宠物固件 OTA 功能权限标识 */
export enum AiPetFirmwareAuth {
  /** OTA管理 | AI宠物固件管理 | 列表 */
  List = 'FE:ota:aiPetFirmware:list',
  /** OTA管理 | AI宠物固件管理 | 详情 */
  SINGLE = 'FE:ota:aiPetFirmware:single',
  /** OTA管理 | AI宠物固件管理 | 新增 */
  ADD = 'FE:ota:aiPetFirmware:add',
  /** OTA管理 | AI宠物固件管理 | 发布 */
  Release = 'FE:ota:aiPetFirmware:release',
  /** OTA管理 | AI宠物固件管理 | 更新 */
  Update = 'FE:ota:aiPetFirmware:update',
  /** OTA管理 | AI宠物固件管理 | 删除 */
  Delete = 'FE:ota:aiPetFirmware:delete',
  /** OTA管理 | AI宠物固件管理 | 附属包添加 */
  PACKAGESADD = 'FE:ota:aiPetFirmware:packages:add',
  /** OTA管理 | AI宠物固件管理 | 附属包删除 */
  PACKAGESDEL = 'FE:ota:aiPetFirmware:packages:delete',
}
