export type InitialWorkerData = {
  rootDirectory: string
}

export type MessageToWorker = {
  type: "get-initial-bundle"
}

export type MessageFromWorker =
  | {
      type: "from-headless-dev-bundler"
      originalEventType: string
      data: any[]
    }
  | {
      type: "initial-bundle"
      bundlePath: string
    }
