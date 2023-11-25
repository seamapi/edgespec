import { getVirtualFileSystemFromDirPath } from "make-vfs"

export const loadApiDirectoryAsVfs = (dirPath) => {
  return getVirtualFileSystemFromDirPath(dirPath)
}
