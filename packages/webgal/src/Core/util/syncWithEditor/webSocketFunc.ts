import { logger } from '../logger';
import { syncWithOrigine } from '@/Core/util/syncWithEditor/syncWithOrigine';
import { DebugCommand, IDebugMessage } from '@/types/debugProtocol';
import { WebGAL } from '@/Core/WebGAL';
import { webgalStore } from '@/store/store';
import { WebgalParser } from '@/Core/parser/sceneParser';
import { runScript } from '@/Core/controller/gamePlay/runScript';

export const webSocketFunc = () => {
  const loc: string = window.location.hostname;
  const protocol: string = window.location.protocol;
  const port: string = window.location.port; // 获取端口号

  // 默认情况下，不需要在URL中明确指定标准HTTP(80)和HTTPS(443)端口
  let defaultPort = '';
  if (port && port !== '80' && port !== '443') {
    // 如果存在非标准端口号，将其包含在URL中
    defaultPort = `:${port}`;
  }

  if (protocol !== 'http:' && protocol !== 'https:') {
    return;
  }
  // 根据当前协议构建WebSocket URL，并包括端口号（如果有）
  let wsUrl = `ws://${loc}${defaultPort}/api/webgalsync`;
  if (protocol === 'https:') {
    wsUrl = `wss://${loc}${defaultPort}/api/webgalsync`;
  }
  logger.info('正在启动socket连接位于：' + wsUrl);
  const socket = new WebSocket(wsUrl);
  socket.onopen = () => {
    logger.info('socket已连接');
    function sendStageSyncMessage() {
      const message: IDebugMessage = {
        event: 'message',
        data: {
          command: DebugCommand.SYNCFC,
          sceneMsg: {
            scene: WebGAL.sceneManager.sceneData.currentScene.sceneName,
            sentence: WebGAL.sceneManager.sceneData.currentSentenceId,
          },
          stageSyncMsg: webgalStore.getState().stage,
          message: 'sync',
        },
      };
      socket.send(JSON.stringify(message));
      // logger.debug('传送信息', message);
      setTimeout(sendStageSyncMessage, 1000);
    }
    sendStageSyncMessage();
  };
  socket.onmessage = (e) => {
    // logger.info('收到信息', e.data);
    const str: string = e.data;
    const data: IDebugMessage = JSON.parse(str);
    const message = data.data;
    if (message.command === DebugCommand.JUMP) {
      syncWithOrigine(message.sceneMsg.scene, message.sceneMsg.sentence, message.message === 'exp');
    }
    if (message.command === DebugCommand.EXE_COMMAND) {
      const command = message.message;
      const scene = WebgalParser.parse(command, 'temp.txt', 'temp.txt');
      const sentence = scene.sentenceList[0];
      runScript(sentence);
    }
    if (message.command === DebugCommand.REFETCH_TEMPLATE_FILES) {
      const title = document.getElementById('Title_enter_page');
      if (title) {
        title.style.display = 'none';
      }
      WebGAL.events.styleUpdate.emit();
    }
  };
  socket.onerror = (e) => {
    logger.info('当前没有连接到 Terre 编辑器');
  };
};
