/**
 * 
 * @author Christian John Elmedo
 * @savvy
 * @2019
 * @Leekie Inc.
 * @READDIR Modules
 * 
 */

/**
 * 
 * 
 * *******************************************************************************************************
 * [METHOD]
 * -> [GET] = get the target directory/file content
 * -> [FIND] = same with GET but with root path
 * -> [EXECUTE] = execute the target directory/file recursively "file must bet function/modular/object"
 * *******************************************************************************************************
 * 
 * *******************************************************************************************************
 * [Sample File Structure]
 * api: { 
 *          admin: { 
 *              'api-botLogin': [Function], // return 'api-botLogin'; 
 *              'api-botLogout': [Function] // return ''api-botLogout';
 *          },
 *          test_api: [Function] // return 'test_api'; 
 *      }
 * *******************************************************************************************************
 * 
 * ->[REQUIRE]
 *      -> const READDIR = require('savvy_readDir');
 * ->[INITIALIZE]
 *      -> const ReadDir = new READDIR().init();
 * 
 * ->[GET/FIND] 
 *      -> ReadDir.get('api');
 *      = { admin: { 'api-botLogin': [Function], 'api-botLogout': [Function] }, test_api: [Function] }
 * 
 * ->[GET/FIND] 
 *      -> ReadDir.get('api.admin');
 *      = { 'api-botLogin': [Function], 'api-botLogout': [Function] }
 * 
 * ->[GET/FIND] [MULTIPLE]
 *      -> ReadDir.get('api.admin api.test_api');
 *      = { 'api-botLogin': [Function], 'api-botLogout': [Function], test_api: [Function] }
 * 
 * ->[GET/FIND] [EXLCUDE FILE] 
 *      -> ReadDir.get('api.admin', 'api-botLogin');
 *      = { 'api-botLogout': [Function] }
 * 
 * ->[EXECUTE] [EXLCUDE DIRECTORY]
 *      -> ReadDir.execute('api', 'admin');
 *      = { api: { test_api: 'test_api' } }
 * 
 * ->[EXECUTE] [PARAMETERS] 
 *      -> ReadDir.execute('api.admin', null, param1, param2...);
 *      = { api:{ admin:{ 'api-botLogin': 'api-botLogin','api-botLogout': 'api-botLoOut' } } }
 * 
 * ->[EXECUTE] [EXLCUDE] [PARAMETERS]
 *      -> ReadDir.execute('api.admin', 'api-botLogout', param1, param2...);
 *      = { api: { admin: { 'api-botLogin': 'api-botLogin' } } }
 * 
 */

const fs = require('fs');
const _ = require('savvy_readDir/node_modules/lodash');

class READDIR {

    constructor() {
        this._result = {};
        this._exclude = [];
        this._path = [];
        this._rootPath = this.getRootPath();
        this._fileDirectoryStructure = this.getFileStructure();
        this._params = null;
    }

    getRootPath() {
        let dirname = require('path').resolve(__dirname);
        let target_dir = _.split(dirname, '\\node_modules'); //windows
        if (target_dir.length <= 1) target_dir = _.split(dirname, '/node_modules'); //linux
        return target_dir[0];
    }

    /**
     * addPath
     * @param {string} newPath new path
     */
    addPath(newPath) {
        _.forEach(_.split(newPath, ' '), (v) => {
            this._path.push(v);
        });
        this._fileDirectoryStructure = this.getFileStructure();
        this.init();
        return this;
    }

    checkExclude(_toBeCheck, next, next1) {
        if (_.indexOf(this._exclude, _toBeCheck) < 0) {
            next();
        } else {
            next1();
        }
    }

    /**
     * checkType
     * @description check if type of _toBeCheck is [string/function]
     * @param {any} _toBeCheck 
     */
    checkType(_toBeCheck) { return typeof _toBeCheck == 'string' || typeof _toBeCheck == 'function'; }

    /**
     * readTargetPath
     * @param {object} o temp storage
     * @param {object} obj object to be check
     * @param {string}{optional} p root path of app
     * @param {any}{optional} params parameters for executing function file
     * @returns {object} o file directory structure
     */
    readTargetPath(o, obj, p = null, ...params) {
        let self = this;
        try {
            _.forIn(obj, (v, i) => {
                if (self.checkType(v)) {
                    try {
                        p ? _.set(o, v, require(`${p}/${i}`)) : _.set(o, i, self.exec(v, params));
                    } catch (_e) { p ? _.set(o, v, require(`${self.getRootPath()}/${p}/${i}`)) : _.set(o, i, self.exec(v, params)); }
                } else {
                    _.forIn(v, (v1, e) => {
                        if (self.checkType(v1)) {
                            try {
                                p ? _.set(o, `${i}.${v1}`, require(`${p}/${i}/${e}`)) : _.set(o, `${i}.${e}`, self.exec(v1, params));
                            } catch (_e) { p ? _.set(o, `${i}.${v1}`, require(`${self.getRootPath()}/${p}/${i}/${e}`)) : _.set(o, `${i}.${e}`, self.exec(v1, params)); }
                        } else {
                            _.forIn(v1, (v2, u) => {
                                if (self.checkType(v2)) {
                                    try {
                                        p ? _.set(o, `${i}.${e}.${v2}`, require(`${p}/${i}/${e}/${u}`)) : _.set(o, `${i}.${e}.${u}`, self.exec(v2, params));
                                    } catch (_e) { p ? _.set(o, `${i}.${e}.${v2}`, require(`${self.getRootPath()}/${p}/${i}/${e}/${u}`)) : _.set(o, `${i}.${e}.${u}`, self.exec(v2, params)); }
                                } else {
                                    _.set(o, `${i}.${e}.${u}`, {});
                                    self.readTargetPath(o[i][e][u], v2, `/${i}/${e}/${u}`);
                                }
                            });
                        }
                    });
                }
            });
            return o;
        } catch (error) {
           throw error;
        }
    }

    /**
    * fsRun
    * @description get the file directory structure of app using fs module
    * @param {string} __path target path to read
    * @param {object} __obj temp storage
    */
    fsRun(__path, __obj) {
        let self = this;
        try {
            if (fs.lstatSync(__path).isDirectory()) {
                // dir
                _.forEach(fs.readdirSync(__path), (dir) => {
                    if (fs.lstatSync(`${__path}/${dir}`).isDirectory()) {
                        // dir
                        __obj[dir] = {};
                        self.fsRun(`${__path}/${dir}`, __obj[dir]);
                    } else {
                        // file
                        __obj[dir] = _.split(dir, '.')[0]/* remove extention from file name */;
                    }
                });
            } else {
                // file
                // add more code here!
            }
        } catch (error) {
            console.warn(`[WARNING] unable to execute the fsRun [${__path}], stack : ${error.stack}`);
        }
    }

    // getFileStructure
    getFileStructure() {
        let self = this;
        let _fileDirectoryStructure = {};
        _.forEach(self._path, (p) => {
            _fileDirectoryStructure[p] = {};
            self.fsRun(`${self._rootPath}/${p}`, _fileDirectoryStructure[p]);
        });
        return _fileDirectoryStructure;
    }

    // initialize to read the app file structure
    init() {
        // console.time('[READDIR] init');
        this.readTargetPath(this._result, this._fileDirectoryStructure, this._rootPath);
        // console.timeEnd('[READDIR] init');
        return this;
    }

    // exec
    exec(req) {
        let self = this;
        let _res = {};

        if (typeof req === 'function') {
            _res = self._params ? req(self._params) : req;
        } else {

            // function to execute the target
            function ___exec(___toBeExec) {
                try {
                    return ___toBeExec(self._params);
                } catch (error) {
                    const [p1, p2, p3, p4, p5, p6, p7, p8, p9] = self._params;
                    return ___toBeExec(p1, p2, p3, p4, p5, p6, p7, p8, p9);
                }
            }

            // assign object except that it iterates over own and inherited source properties.
            _res = _.assignIn(_res, req);

            function _filteringObj(___o) {
                let ___res = {};
                function ___run(aaa, kkk) {
                    _.forIn(aaa, (v, k) => {

                        let _targetKey = kkk ? `${kkk}.${k}` : k;

                        self.checkExclude(_targetKey, () => {
                            if (typeof v === 'function') {
                                _.set(___res, _targetKey, self._params ? ___exec(v) : v);
                            } else {
                                if (typeof v === 'object') {
                                    _.forIn(v, (v1, k1) => {

                                        let __targetKey = kkk ? `${kkk}.${k}.${k1}` : `${k}.${k1}`;

                                        self.checkExclude(__targetKey, () => {
                                            if (typeof v1 === 'function') {
                                                _.set(___res, __targetKey, self._params ? ___exec(v1) : v1);
                                            } else {
                                                ___run(v1, __targetKey);
                                            }
                                        }, () => {
                                            // unset property in ___res
                                            _.unset(___res, __targetKey);
                                        });
                                    });
                                }
                            }
                        }, () => {
                            // unset property in ___res
                            _.unset(___res, _targetKey);
                        });
                    });
                }

                ___run(___o);

                return ___res;
            };

            _res = _filteringObj(_res);

        }
        return _res;
    }

    // navigateProperties
    navigateProperties(param, type) {

        let self = this;
        let temp = {};
        let target = _.split(param, '.');
        let [a, b, c, d, e, f] = target;
        let _allKeys = [
            `${a}`,
            `${a}.${b}`,
            `${a}.${b}.${c}`,
            `${a}.${b}.${c}.${d}`,
            `${a}.${b}.${c}.${d}.${e}`,
            `${a}.${b}.${c}.${d}.${e}.${f}`
        ];
        let _length = (target.length - 1);
        let _keys = _allKeys[_length];

        try {
            self.checkExclude(target[_length], () => {
                if (type === 'get') {
                    // GET
                    temp = _.get(self._result, _keys);
                } else if (type === 'find') {
                    // FIND
                    _.set(temp, _keys, _.get(self._result, _keys));
                } else if (type === 'exec') {
                    // EXEC
                    _.set(temp, _keys, self.exec(_.get(self._result, _keys)));
                } else {
                    console.warn(`[WARNING] unable to execute the target path undefined [type], stack : ${type}`);
                }
            }, () => {
                // exclude key
                _.unset(temp, _keys);
            });

            return temp;

        } catch (error) {
            console.warn(`[WARNING] unable to execute the target path [${target}], stack : ${error.stack}`);
            return temp;
        }
    }

    /**
     * setNavigateProperties
     * @param {string} p target to select
     * @param {string} e target to exclude [optional]
     * @param {string} type type of navigation [find/exec] 
     * @param {any} params 
     */
    setNavigateProperties(p, e, type, params) {

        let self = this;
        let temp = {};

        // setting parameters if type [is execute]
        if (type === 'exec') {
            self._params = params;
        }

        self._exclude = _.split(e, ' ');/* getting all exclude */

        const _targetPath = _.split(p, ' ');/* getting all target */

        _.forEach(_targetPath, (v) => {

            let __ = self.navigateProperties(v, type);

            if (typeof __ === 'function') {
                if (_targetPath.length > 1) {
                    _.set(temp, _.last(_.split(v, '.')), __);
                } else { temp = __; }
            } else {
                temp = _.merge(temp, __);
            }
        });

        // exclude
        if (type === 'get' || type === 'find' && self._exclude && self._exclude.length > 0) {
            _.forIn(temp, (_v, _i) => {
                _.forEach(self._exclude, (_ex) => _.unset(_v, _ex));
            });
        }

        return temp;

    }

    // clear params and exclude storage
    clear() {
        this._params = null;
        this._exclude = [];
    }

    /**
     * get
     * @param {string} p target to find
     * @param {string} e target to exclude
     */
    get(p, e) {
        // console.time('[READDIR] get');
        this.clear();
        const result = this.setNavigateProperties(p, e, 'get');
        // console.timeEnd('[READDIR] get');
        return result;
    }

    /**
     * execute
     * @param {string} p target to execute
     * @param {string} e target to exclude
     * @param  {...any} params 
     */
    execute(p, eee, ...params) {
        // console.time('[READDIR] execute');
        this.clear();
        const result = this.setNavigateProperties(p, eee, 'exec', params);
        // console.timeEnd('[READDIR] execute');
        return result;
    }

    /**
    * execute
    * @param {string} p target to execute
    * @param {string} e target to exclude
    */
    find(p, e) {
        // console.time('[READDIR] find');
        this.clear();
        const result = this.setNavigateProperties(p, e, 'find');
        // console.timeEnd('[READDIR] find');
        return result;
    }

}

module.exports = READDIR;