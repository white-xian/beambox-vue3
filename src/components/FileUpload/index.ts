import { withInstall } from '@/utils'
import fileUpload from './src/FileUpload.vue'
import singleFileUpload from './src/SingleFileUpload.vue'
import multiFileUpload from './src/MultiFileUpload.vue'

export const FileUpload = withInstall(fileUpload)
export const SingleFileUpload = withInstall(singleFileUpload)
export const MultiFileUpload = withInstall(multiFileUpload)

export default FileUpload

export * from './src/types'
export * from './src/helper'
export { fileUploadProps } from './src/props'
export { useFileUpload } from './src/hooks/useFileUpload'
export type { UseFileUploadOptions } from './src/hooks/useFileUpload'
