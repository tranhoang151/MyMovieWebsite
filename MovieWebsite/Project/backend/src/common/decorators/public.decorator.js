const IS_PUBLIC_KEY = Symbol('isPublic');

function Public() {
  return function (target, propertyKey, descriptor) {
    const value = descriptor ? descriptor.value : target;
    if (typeof Reflect !== 'undefined' && Reflect.defineMetadata) {
      Reflect.defineMetadata(IS_PUBLIC_KEY, true, value);
    }
  };
}

module.exports = {
  IS_PUBLIC_KEY,
  Public,
};
