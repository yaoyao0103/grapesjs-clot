import { myEditor } from '..';

export const TMD = (tarOp, refOp) => {
  console.log('TMD');
  // ref
  const parentId = refOp.opts.parentId;
  const modelIndex = refOp.opts.index;

  // tar
  let dstId = tarOp.opts.dstId;
  let pos = tarOp.opts.pos;

  // the model to delete and the destination to drop are the same
  if (parentId == dstId) {
    // destination index
    const index = pos.method === 'after' ? pos.indexEl + 1 : pos.indexEl;
    if (index > modelIndex) {
      tarOp.opts.pos.indexEl -= 1;
    }
  }
  // the model to delete and the src of drag are the same => no inference because src is gotten by id
  return tarOp;
};
export const TMM = (tarOp, refOp) => {
  console.log('TMM');
  // ref
  let refDstId = refOp.opts.dstId;
  let refDstPos = refOp.opts.pos;
  let refDstIndex = refDstPos.method === 'after' ? refDstPos.indexEl + 1 : refDstPos.indexEl;

  let refSrcId = refOp.opts.srcParentId;
  let refSrcIndex = refOp.opts.srcIndex;

  // tar
  let tarDstId = tarOp.opts.dstId;
  let tarDstPos = tarOp.opts.pos;
  let tarDstIndex = tarDstPos.method === 'after' ? tarDstPos.indexEl + 1 : tarDstPos.indexEl;

  // Both destination to drop are the same
  if (tarDstId === refSrcId) {
    if (tarDstIndex > refSrcIndex) {
      tarOp.opts.pos.indexEl -= 1;
      console.log('-----1');
    }
  }

  if (refDstId === tarDstId) {
    if (tarDstIndex > refDstIndex || (tarDstIndex == refDstIndex && tarOp.username < refOp.username)) {
      tarOp.opts.pos.indexEl += 1;
      console.log('+++++1');
    }
  }
  return tarOp;
};
export const TMA = (tarOp, refOp) => {
  console.log('TMA');
  // ref Dst
  let refDstId = refOp.opts.dstId;
  let refDstPos = refOp.opts.pos;
  let refDstIndex = refDstPos.method === 'after' ? refDstPos.indexEl + 1 : refDstPos.indexEl;

  // tar Dst
  let tarDstId = tarOp.opts.dstId;
  let tarDstPos = tarOp.opts.pos;
  let tarDstIndex = tarDstPos.method === 'after' ? tarDstPos.indexEl + 1 : tarDstPos.indexEl;

  // Both destination to drop are the same
  if (refDstId === tarDstId) {
    if (tarDstIndex >= refDstIndex) {
      tarOp.opts.pos.indexEl += 1;
    }
  }
  return tarOp;
};
export const TAD = (tarOp, refOp) => {
  console.log('TAD');
  // ref
  const parentId = refOp.opts.parentId;
  const modelIndex = refOp.opts.index;

  // tar
  let dstId = tarOp.opts.dstId;
  let pos = tarOp.opts.pos;

  // the model to delete and the destination to drop are the same
  if (parentId === dstId) {
    // destination index
    const index = pos.method === 'after' ? pos.indexEl + 1 : pos.indexEl;
    if (index > modelIndex) {
      tarOp.opts.pos.indexEl -= 1;
    }
  }
  // the model to delete and the src of drag are the same => no inference because src is gotten by id
  return tarOp;
};
export const TAM = (tarOp, refOp) => {
  console.log('TAM');
  // ref src
  let refDstId = refOp.opts.dstId;
  let refDstPos = refOp.opts.pos;
  let refDstIndex = refDstPos.method === 'after' ? refDstPos.indexEl + 1 : refDstPos.indexEl;

  let refSrcId = refOp.opts.srcParentId;
  let refSrcIndex = refOp.opts.srcIndex;

  // tar
  let tarDstId = tarOp.opts.dstId;
  let tarDstPos = tarOp.opts.pos;
  let tarDstIndex = tarDstPos.method === 'after' ? tarDstPos.indexEl + 1 : tarDstPos.indexEl;

  if (tarDstId === refSrcId) {
    if (tarDstIndex > refSrcIndex) {
      tarOp.opts.pos.indexEl -= 1;
    }
  }

  // Both destination to drop are the same
  if (refDstId === tarDstId) {
    if (tarDstIndex > refDstIndex) {
      tarOp.opts.pos.indexEl += 1;
    }
  }
  return tarOp;
};

// ok
export const TAA = (tarOp, refOp) => {
  console.log('TAA');
  // ref
  let refDstId = refOp.opts.dstId;
  let refPos = refOp.opts.pos;

  // tar
  let tarDstId = tarOp.opts.dstId;
  let tarPos = tarOp.opts.pos;

  // Both destination to drop are the same
  if (refDstId == tarDstId) {
    // destination index
    let refIndex = refPos.method === 'after' ? refPos.indexEl + 1 : refPos.indexEl;
    let tarIndex = tarPos.method === 'after' ? tarPos.indexEl + 1 : tarPos.indexEl;
    if (tarIndex > refIndex || (tarIndex == refIndex && tarOp.username > refOp.username)) {
      tarOp.opts.pos.indexEl += 1;
    }
  }
  return tarOp;
};
