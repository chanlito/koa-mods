import { expect } from 'chai';
import * as Koa from 'koa';
import { resolve as pathResolve } from 'path';

import { Controller, useKoaMods } from '../src';

@Controller('dogs')
class DogsController {}

@Controller('posts')
class PostsController {}

const app = new Koa();

describe('useKoaMods', function() {
  describe('with an array of classes', function() {
    it('should not throw any errors', function() {
      expect(() =>
        useKoaMods({
          app,
          controllers: [ DogsController, PostsController ]
        })
      ).to.not.throw();
    });
  });

  describe('with an array of glob pattern', function() {
    it('should not throw any errors', function() {
      expect(() =>
        useKoaMods({
          app,
          controllers: [ pathResolve(__dirname, '*.controller.ts') ]
        })
      ).to.not.throw;
    });
  });

  describe('with custom validation options', function() {
    it('should not throw any errors', function() {
      expect(() =>
        useKoaMods({
          app,
          controllers: [],
          customValidateOptions: {
            rules: [],
            messages: {
              string: 'The {{field}} must be a string.'
            }
          }
        })
      ).to.not.throw;
    });
  });
});
