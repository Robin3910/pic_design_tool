import mitt from 'mitt';

type Events = {
  refreshUserImages: any;
  refreshPhotoList: any;
  refreshTextList: any;
  refreshOrderList: any;
  clearMaterials: any;
  [key: string]: any;
};

const emitter = mitt<Events>();

export default emitter;