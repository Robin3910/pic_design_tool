import mitt from 'mitt';

type Events = {
  refreshUserImages: any;
  refreshPhotoList: any;
  refreshTextList: any;
  clearMaterials: any;
};

const emitter = mitt<Events>();

export default emitter;