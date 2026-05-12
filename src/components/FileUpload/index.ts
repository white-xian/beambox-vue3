import { withInstall } from '@/utils'
import fileUpload from './src/FileUpload.vue'

export const FileUpload = withInstall(fileUpload)
export default FileUpload

export * from './src/types'
export * from './src/helper'
export { fileUploadProps } from './src/props'
