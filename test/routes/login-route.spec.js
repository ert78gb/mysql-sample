"use strict";

const chai = require('chai');
const   request = require('supertest');
const sinon = require('sinon');
const server = require('./../testServer');
const db = require('../db/index');
const UserRepository = require('../../src/repositories/user-repository');

chai.use(require('chai-as-promised'));
chai.use(require('chai-string'));
chai.use(require('chai-datetime'));

const expect = chai.expect;

describe('login test', () => {
  let saveUserSpy,
    findByEmailSpy,
    baseData = {
      email: 'a@a.hu',
      pwdHash: '$2a$15$Q2iLJL1zcne6PvtefYuG.uVdX9ET4o/OCf87d0ExkmEAn4gdE53YK'
    },
    savedUser
  ;

  beforeEach(() => {
    return db.cleaner.cleanAll()
      .then(() => {
        return new UserRepository().save(baseData);
      })
      .then((user) => {
        savedUser = user;
        initSpys();
        return Promise.resolve()
      })
  });

  afterEach(()=>{
    restoreSpys();
  });

  function initSpys() {
    saveUserSpy = sinon.spy(UserRepository.prototype, 'save');
    findByEmailSpy = sinon.spy(UserRepository.prototype, 'findByEmail');
  }

  function restoreSpys() {
    saveUserSpy.restore();
    findByEmailSpy.restore();
  }

  it('success', function() {
    this.timeout(10000);

    let data = {
      email: baseData.email,
      password: "initPassword122!"
    };

    let requestDate = new Date();

    return request(server)
      .post('/login')
      .send(data)
      .expect(200)
      .expect((response) => {
        let user = JSON.parse(response.text);
        expect(user.pwdHash).to.be.not.ok;
        expect(findByEmailSpy.callCount).to.be.equal(1);
        expect(saveUserSpy.callCount).to.be.equal(1);
        return new UserRepository().findById(savedUser.id)
          .then((user) => {
            expect(user.lastLogonDate > requestDate).to.be.true;
          })
      })
  });

  it('no e-emil address', () => {
    let data = {
      password: "initPassword122!"
    };

    return request(server)
      .post('/login')
      .send(data)
      .expect(400)
      .expect((response) => {
        let result = JSON.parse(response.text);
        expect(result.name).to.be.equal('ValidationError');
        expect(result.message).to.be.equal('wrong_email');
        expect(findByEmailSpy.callCount).to.be.equal(0);
        expect(saveUserSpy.callCount).to.be.equal(0);
      })
  });

  it('no password', () => {
    let data = {
      email: baseData.email,
    };

    return request(server)
      .post('/login')
      .send(data)
      .expect(400)
      .expect((response) => {
        let result = JSON.parse(response.text);
        expect(result.name).to.be.equal('ValidationError');
        expect(result.message).to.be.equal('wrong_password');
        expect(findByEmailSpy.callCount).to.be.equal(0);
        expect(saveUserSpy.callCount).to.be.equal(0);
        restoreSpys();
      })
  });

  it('wrong e-mail', () => {
    let data = {
      email: 'b@g.com',
      password: "initPassword122!"
    };

    return request(server)
      .post('/login')
      .send(data)
      .expect(400)
      .expect((response) => {
        let result = JSON.parse(response.text);
        expect(result.name).to.be.equal('ValidationError');
        expect(result.message).to.be.equal('wrong_username_password');
        expect(findByEmailSpy.callCount).to.be.equal(1);
        expect(saveUserSpy.callCount).to.be.equal(0);
      })
  });

  it('wrong password', function() {
    this.timeout(10000);

    let data = {
      email: baseData.email,
      password: "initPassword122!a"
    };

    request(server)
      .post('/login')
      .send(data)
      .expect(400)
      .expect((response) => {
        let result = JSON.parse(response.text);
        expect(result.name).to.be.equal('ValidationError');
        expect(result.message).to.be.equal('wrong_username_password');
        expect(findByEmailSpy.callCount).to.be.equal(1);
        expect(saveUserSpy.callCount).to.be.equal(0);
      })
  })
});
