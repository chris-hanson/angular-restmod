'use strict';

ddescribe('Plugin: Dirty Model', function() {

  var bike;

  beforeEach(module('restmod'));

  beforeEach(module(function($provide, restmodProvider) {
    restmodProvider.rebase('DirtyModel');
    $provide.factory('Bike', function(restmod) {
      return restmod.model('/api/bikes');
    });
  }));

  beforeEach(inject(function($httpBackend, Bike) {
    // generate a model instance with server loaded data:
    $httpBackend.when('GET', '/api/bikes/1').respond(200, {
      model: 'Meta 2',
      colours: { frame: 'red' },
      brandName: 'Commencal',
      stickers: ['bmx', 'bandits'],
      customisations: { wheels: 2, seat: { material: 'lycra' } }
    });
    bike = Bike.$find(1);
    $httpBackend.flush();
  }));

  describe('`$dirty` function', function() {

    it('should detect when a server property changes', function() {
      expect(bike.$dirty('model')).toBe(false);
      bike.model = 'Meta AM';
      expect(bike.$dirty('model')).toBe(true);
    });

    it('should list changed properties', function() {
      bike.brandName = 'Commencal Bikes';
      expect(bike.$dirty()).toContain('brandName');
      expect(bike.$dirty()).not.toContain('model');
      bike.model = 'Meta AM';
      expect(bike.$dirty()).toContain('brandName');
      expect(bike.$dirty()).toContain('model');
    });

    it('should list changes on nested objects', function() {
      bike.brandName = 'BMX';
      expect(bike.$dirty()).not.toContain('customisations.wheels');
      
      bike.customisations.wheels = 3;
      bike.colours.frame = 'green';
      expect(bike.$dirty()).toContain('customisations.wheels');
      expect(bike.$dirty()).toContain('colours.frame');
      
      bike.customisations.seat.material = 'leather';
      expect(bike.$dirty()).toContain('customisations.seat.material');
    });

    it('should compare arrays', function() {
      bike.brandName = 'BMX';
      expect(bike.$dirty()).not.toContain('stickers');
      bike.stickers.pop();
      expect(bike.$dirty()).toContain('stickers');
    });

    it('should compare with comparator function', function() {
      bike.customisations.wheels = 3;
      expect(bike.$dirty('customisations.wheels', function (newVal, oldVal) {
        return newVal * oldVal > 5;
      })).toBe(true);
    });

    it('should let you pass comparator as first argument', function() {
      bike.colours.frame = 'Brown';
      bike.brandName = 'BMX';
      bike.model = 'Strider';

      expect(bike.$dirty(function (newVal) {
        return angular.isString(newVal) && newVal.match(/^B/);
      }).length).toEqual(2);
    });

  });

  describe('$restore', function() {

    it('should restore a single property value', function() {
      bike.model = 'Trance';
      bike.brandName = 'Trek';
      bike.$restore('model');
      expect(bike.model).toEqual('Meta 2');
      expect(bike.brandName).toEqual('Trek');
    });

    it('should restore all properties values', function() {
      bike.model = 'Trance';
      bike.brandName = 'Trek';
      bike.$restore();
      expect(bike.model).toEqual('Meta 2');
      expect(bike.brandName).toEqual('Commencal');
    });

    it('should restore nested property', function() {
      bike.customisations.wheels = 4;
      bike.customisations.seat.material = 'leather';
      bike.$restore('customisations.wheels');
      expect(bike.customisations.wheels).toEqual(2);
      expect(bike.customisations.seat.material).toEqual('leather');
    });

    it('should restore an entire nested object', function() {
      bike.customisations.wheels = 8;
      bike.customisations.seat.material = 'cloth';
      bike.$restore('customisations');
      expect(bike.customisations.wheels).toEqual(2);
      expect(bike.customisations.seat.material).toEqual('lycra');
    });
  });
});
