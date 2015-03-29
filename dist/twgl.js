/*
* Copyright 2015, Gregg Tavares.
* All rights reserved.
*
* Redistribution and use in source and binary forms, with or without
* modification, are permitted provided that the following conditions are
* met:
*
*     * Redistributions of source code must retain the above copyright
* notice, this list of conditions and the following disclaimer.
*     * Redistributions in binary form must reproduce the above
* copyright notice, this list of conditions and the following disclaimer
* in the documentation and/or other materials provided with the
* distribution.
*     * Neither the name of Gregg Tavares. nor the names of his
* contributors may be used to endorse or promote products derived from
* this software without specific prior written permission.
*
* THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
* "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
* LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
* A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
* OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
* SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
* LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
* DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
* THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
* (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
* OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/(function(root,factory){if(typeof define==="function"&&define.amd){define([],factory)}else{var lib=factory.call(root);root.twgl=root.twgl||{};Object.keys(lib).forEach(function(key){root.twgl[key]=lib[key]})}})(this,function(){"use strict";var topWindow=this;function log(msg){if(topWindow.console&&topWindow.console.log){topWindow.console.log(msg)}}function error(msg){if(topWindow.console){if(topWindow.console.error){topWindow.console.error(msg)}else if(topWindow.console.log){topWindow.console.log(msg)}}}function loggingOff(){log=function(){};error=function(){}}function glEnumToString(gl,value){for(var p in gl){if(gl[p]==value){return p}}return"0x"+value.toString(16)}function setupWebGL(canvas,opt_attribs){var context=create3DContext(canvas,opt_attribs);return context}var create3DContext=function(canvas,opt_attribs){var names=["webgl","experimental-webgl"];var context=null;for(var ii=0;ii<names.length;++ii){try{context=canvas.getContext(names[ii],opt_attribs)}catch(e){}if(context){break}}return context};function getWebGLContext(canvas,opt_attribs){var gl=setupWebGL(canvas,opt_attribs);return gl}function loadShader(gl,shaderSource,shaderType,opt_errorCallback){var errFn=opt_errorCallback||error;var shader=gl.createShader(shaderType);gl.shaderSource(shader,shaderSource);gl.compileShader(shader);var compiled=gl.getShaderParameter(shader,gl.COMPILE_STATUS);if(!compiled){var lastError=gl.getShaderInfoLog(shader);errFn("*** Error compiling shader '"+shader+"':"+lastError);gl.deleteShader(shader);return null}return shader}function createProgram(gl,shaders,opt_attribs,opt_locations,opt_errorCallback){var errFn=opt_errorCallback||error;var program=gl.createProgram();for(var ii=0;ii<shaders.length;++ii){gl.attachShader(program,shaders[ii])}if(opt_attribs){for(var ii=0;ii<opt_attribs.length;++ii){gl.bindAttribLocation(program,opt_locations?opt_locations[ii]:ii,opt_attribs[ii])}}gl.linkProgram(program);var linked=gl.getProgramParameter(program,gl.LINK_STATUS);if(!linked){var lastError=gl.getProgramInfoLog(program);errFn("Error in program linking:"+lastError);gl.deleteProgram(program);return null}return program}function createShaderFromScript(gl,scriptId,opt_shaderType,opt_errorCallback){var shaderSource="";var shaderType;var shaderScript=document.getElementById(scriptId);if(!shaderScript){throw"*** Error: unknown script element"+scriptId}shaderSource=shaderScript.text;if(!opt_shaderType){if(shaderScript.type=="x-shader/x-vertex"){shaderType=gl.VERTEX_SHADER}else if(shaderScript.type=="x-shader/x-fragment"){shaderType=gl.FRAGMENT_SHADER}else if(shaderType!=gl.VERTEX_SHADER&&shaderType!=gl.FRAGMENT_SHADER){throw"*** Error: unknown shader type";return null}}return loadShader(gl,shaderSource,opt_shaderType?opt_shaderType:shaderType,opt_errorCallback)}var defaultShaderType=["VERTEX_SHADER","FRAGMENT_SHADER"];function createProgramFromScripts(gl,shaderScriptIds,opt_attribs,opt_locations,opt_errorCallback){var shaders=[];for(var ii=0;ii<shaderScriptIds.length;++ii){shaders.push(createShaderFromScript(gl,shaderScriptIds[ii],gl[defaultShaderType[ii]],opt_errorCallback))}return createProgram(gl,shaders,opt_attribs,opt_locations,opt_errorCallback)}function createProgramFromSources(gl,shaderSources,opt_attribs,opt_locations,opt_errorCallback){var shaders=[];for(var ii=0;ii<shaderSources.length;++ii){shaders.push(loadShader(gl,shaderSources[ii],gl[defaultShaderType[ii]],opt_errorCallback))}return createProgram(gl,shaders,opt_attribs,opt_locations,opt_errorCallback)}function createProgramInfo(gl,shaderSources,opt_attribs,opt_locations,opt_errorCallback){var shaderSources=shaderSources.map(function(source){var script=document.getElementById(source);return script?script.text:source});var program=createProgramFromSources(gl,shaderSources,opt_attribs,opt_locations,opt_errorCallback);if(!program){return}var uniformSetters=createUniformSetters(gl,program);var attribSetters=createAttributeSetters(gl,program);return{program:program,uniformSetters:uniformSetters,attribSetters:attribSetters}}function getBindPointForSamplerType(gl,type){if(type==gl.SAMPLER_2D)return gl.TEXTURE_2D;if(type==gl.SAMPLER_CUBE)return gl.TEXTURE_CUBE_MAP}function createUniformSetters(gl,program){var textureUnit=0;function createUniformSetter(program,uniformInfo){var location=gl.getUniformLocation(program,uniformInfo.name);var type=uniformInfo.type;var isArray=uniformInfo.size>1&&uniformInfo.name.substr(-3)=="[0]";if(type==gl.FLOAT&&isArray)return function(v){gl.uniform1fv(location,v)};if(type==gl.FLOAT)return function(v){gl.uniform1f(location,v)};if(type==gl.FLOAT_VEC2)return function(v){gl.uniform2fv(location,v)};if(type==gl.FLOAT_VEC3)return function(v){gl.uniform3fv(location,v)};if(type==gl.FLOAT_VEC4)return function(v){gl.uniform4fv(location,v)};if(type==gl.INT&&isArray)return function(v){gl.uniform1iv(location,v)};if(type==gl.INT)return function(v){gl.uniform1i(location,v)};if(type==gl.INT_VEC2)return function(v){gl.uniform2iv(location,v)};if(type==gl.INT_VEC3)return function(v){gl.uniform3iv(location,v)};if(type==gl.INT_VEC4)return function(v){gl.uniform4iv(location,v)};if(type==gl.BOOL)return function(v){gl.uniform1iv(location,v)};if(type==gl.BOOL_VEC2)return function(v){gl.uniform2iv(location,v)};if(type==gl.BOOL_VEC3)return function(v){gl.uniform3iv(location,v)};if(type==gl.BOOL_VEC4)return function(v){gl.uniform4iv(location,v)};if(type==gl.FLOAT_MAT2)return function(v){gl.uniformMatrix2fv(location,false,v)};if(type==gl.FLOAT_MAT3)return function(v){gl.uniformMatrix3fv(location,false,v)};if(type==gl.FLOAT_MAT4)return function(v){gl.uniformMatrix4fv(location,false,v)};if((type==gl.SAMPLER_2D||type==gl.SAMPLER_CUBE)&&isArray){var units=[];for(var ii=0;ii<info.size;++ii){units.push(textureUnit++)}return function(bindPoint,units){return function(textures){gl.uniform1iv(location,units);textures.forEach(function(texture,index){gl.activeTexture(gl.TEXTURE0+units[index]);gl.bindTexture(bindPoint,tetxure)})}}(getBindPointForSamplerType(gl,type),units)}if(type==gl.SAMPLER_2D||type==gl.SAMPLER_CUBE)return function(bindPoint,unit){return function(texture){gl.uniform1i(location,unit);gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(bindPoint,texture)}}(getBindPointForSamplerType(gl,type),textureUnit++);throw"unknown type: 0x"+type.toString(16)}var uniformSetters={};var numUniforms=gl.getProgramParameter(program,gl.ACTIVE_UNIFORMS);for(var ii=0;ii<numUniforms;++ii){var uniformInfo=gl.getActiveUniform(program,ii);if(!uniformInfo){break}var name=uniformInfo.name;if(name.substr(-3)=="[0]"){name=name.substr(0,name.length-3)}var setter=createUniformSetter(program,uniformInfo);uniformSetters[name]=setter}return uniformSetters}function setUniforms(setters,values){setters=setters.uniformSetters||setters;Object.keys(values).forEach(function(name){var setter=setters[name];if(setter){setter(values[name])}})}function createAttributeSetters(gl,program){var attribSetters={};function createAttribSetter(index){return function(b){gl.bindBuffer(gl.ARRAY_BUFFER,b.buffer);gl.enableVertexAttribArray(index);gl.vertexAttribPointer(index,b.numComponents||b.size,b.type||gl.FLOAT,b.normalize||false,b.stride||0,b.offset||0)}}var numAttribs=gl.getProgramParameter(program,gl.ACTIVE_ATTRIBUTES);for(var ii=0;ii<numAttribs;++ii){var attribInfo=gl.getActiveAttrib(program,ii);if(!attribInfo){break}var index=gl.getAttribLocation(program,attribInfo.name);attribSetters[attribInfo.name]=createAttribSetter(index)}return attribSetters}function setAttributes(setters,buffers){Object.keys(buffers).forEach(function(name){var setter=setters[name];if(setter){setter(buffers[name])}})}function setBuffersAndAttributes(gl,programInfo,buffers){setAttributes(programInfo.attribSetters||programInfo,buffers.attribs);if(buffers.indices){gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,buffers.indices)}}var browserPrefixes=["","MOZ_","OP_","WEBKIT_"];function getExtensionWithKnownPrefixes(gl,name){for(var ii=0;ii<browserPrefixes.length;++ii){var prefixedName=browserPrefixes[ii]+name;var ext=gl.getExtension(prefixedName);if(ext){return ext}}}function resizeCanvasToDisplaySize(canvas){var width=canvas.clientWidth;var height=canvas.clientHeight;if(canvas.width!=width||canvas.height!=height){canvas.width=width;canvas.height=height;return true}return false}function getIFrameForWindow(window){if(!isInIFrame(window)){return}var iframes=window.parent.document.getElementsByTagName("iframe");for(var ii=0;ii<iframes.length;++ii){var iframe=iframes[ii];if(iframe.contentDocument===window.document){return iframe}}}function isFrameVisible(window){try{var iframe=getIFrameForWindow(window);if(!iframe){return true}var bounds=iframe.getBoundingClientRect();var isVisible=bounds.top<window.parent.innerHeight&&bounds.bottom>=0&&bounds.left<window.parent.innerWidth&&bounds.right>=0;return isVisible&&isFrameVisible(window.parent)}catch(e){return true}}function isOnScreen(element){var isVisible=true;if(element){var bounds=element.getBoundingClientRect();isVisible=bounds.top<topWindow.innerHeight&&bounds.bottom>=0}return isVisible&&isFrameVisible(topWindow)}function augmentTypedArray(typedArray,numComponents){var cursor=0;typedArray.push=function(){for(var ii=0;ii<arguments.length;++ii){var value=arguments[ii];if(value instanceof Array||value.buffer&&value.buffer instanceof ArrayBuffer){for(var jj=0;jj<value.length;++jj){typedArray[cursor++]=value[jj]}}else{typedArray[cursor++]=value}}};typedArray.reset=function(opt_index){cursor=opt_index||0};typedArray.numComponents=numComponents;Object.defineProperty(typedArray,"numElements",{get:function(){return this.length/this.numComponents|0}});return typedArray}function createAugmentedTypedArray(numComponents,numElements,opt_type){var type=opt_type||Float32Array;return augmentTypedArray(new type(numComponents*numElements),numComponents)}function createBufferFromTypedArray(gl,array,type,drawType){type=type||gl.ARRAY_BUFFER;var buffer=gl.createBuffer();gl.bindBuffer(type,buffer);gl.bufferData(type,array,drawType||gl.STATIC_DRAW);return buffer}function allButIndices(name){return name!=="indices"}function createMapping(obj){var mapping={};Object.keys(obj).filter(allButIndices).forEach(function(key){mapping["a_"+key]=key});return mapping}function getGLTypeForTypedArray(gl,typedArray){if(typedArray instanceof Int8Array){return gl.BYTE}if(typedArray instanceof Uint8Array){return gl.UNSIGNED_BYTE}if(typedArray instanceof Int16Array){return gl.SHORT}if(typedArray instanceof Uint16Array){return gl.UNSIGNED_SHORT}if(typedArray instanceof Int32Array){return gl.INT}if(typedArray instanceof Uint32Array){return gl.UNSIGNED_INT}if(typedArray instanceof Float32Array){return gl.FLOAT}throw"unsupported typed array type"}function getNormalizationForTypedArray(typedArray){if(typedArray instanceof Int8Array){return true}if(typedArray instanceof Uint8Array){return true}return false}function isArrayBuffer(a){return a.buffer&&a.buffer instanceof ArrayBuffer}function guessNumComponentsFromName(name,length){var numComponents;if(name.indexOf("coord")>=0){numComponents=2}else if(name.indexOf("color")>=0){numComponents=4}else{numComponents=3}if(length%numComponents>0){throw"can not guess numComponents. You should specify it."}return numComponents}function makeTypedArray(array,name){if(isArrayBuffer(array)){return array}if(Array.isArray(array)){array={data:array}}if(!array.numComponents){array.numComponents=guessNumComponentsFromName(name,array.length)}var type=array.type;if(!type){if(name==="indices"){type=Uint16Array}}var numElements=array.data.length/array.numComponents;if(numElements%1){console.warn("numComponents = ",array.numComponents,"doesn't match length = ",array.length,"of data given")}var typedArray=createAugmentedTypedArray(array.numComponents,numElements,type);typedArray.push(array.data);return typedArray}function createAttribsFromArrays(gl,arrays,opt_mapping){var mapping=opt_mapping||createMapping(arrays);var attribs={};Object.keys(mapping).forEach(function(attribName){var bufferName=mapping[attribName];var array=makeTypedArray(arrays[bufferName],bufferName);attribs[attribName]={buffer:createBufferFromTypedArray(gl,array),numComponents:array.numComponents||guessNumComponentsFromName(bufferName),type:getGLTypeForTypedArray(gl,array),normalize:getNormalizationForTypedArray(array)}});return attribs}function getNumElementsFromNonIndexedArrays(arrays){var key=Object.keys(arrays)[0];var array=arrays[key];if(isArrayBuffer(array)){return array.numElements}else{return array.data.length/array.numComponents}}function createBufferInfoFromArrays(gl,arrays,opt_mapping){var bufferInfo={attribs:createAttribsFromArrays(gl,arrays,opt_mapping)};var indices=arrays.indices;if(indices){indices=makeTypedArray(indices,"indices");bufferInfo.indices=createBufferFromTypedArray(gl,indices,gl.ELEMENT_ARRAY_BUFFER);bufferInfo.numElements=indices.length}else{bufferInfo.numElements=getNumElementsFromNonIndexedArrays(arrays)}return bufferInfo}function createBuffersFromArrays(gl,arrays){var buffers={};Object.keys(arrays).forEach(function(key){var type=key=="indices"?gl.ELEMENT_ARRAY_BUFFER:gl.ARRAY_BUFFER;var array=makeTypedArray(arrays[key],name);buffers[key]=createBufferFromTypedArray(gl,array,type)});if(arrays.indices){buffers.numElements=arrays.indices.length}else if(arrays.position){buffers.numElements=arrays.position.length/3}return buffers}function drawBufferInfo(gl,type,bufferInfo,count,offset){var indices=bufferInfo.indices;var numElements=count===undefined?bufferInfo.numElements:count;offset=offset===undefined?offset:0;if(indices){gl.drawElements(type,numElements,gl.UNSIGNED_SHORT,offset)}else{gl.drawArrays(type,offset,numElements)}}function drawObjectList(objectsToDraw){var lastUsedProgramInfo=null;var lastUsedBufferInfo=null;objectsToDraw.forEach(function(object){var programInfo=object.programInfo;var bufferInfo=object.bufferInfo;if(programInfo!==lastUsedProgramInfo){lastUsedProgramInfo=programInfo;gl.useProgram(programInfo.program)}if(bufferInfo!=lastUsedBufferInfo){lastUsedBufferInfo=bufferInfo;setBuffersAndAttributes(gl,programInfo,bufferInfo)}setUniforms(programInfo,object.uniforms);drawBufferInfo(gl,gl.TRIANGLES,bufferInfo)})}return{createAugmentedTypedArray:createAugmentedTypedArray,createAttribsFromArrays:createAttribsFromArrays,createBuffersFromArrays:createBuffersFromArrays,createBufferInfoFromArrays:createBufferInfoFromArrays,createAttributeSetters:createAttributeSetters,createProgram:createProgram,createProgramFromScripts:createProgramFromScripts,createProgramFromSources:createProgramFromSources,createProgramInfo:createProgramInfo,createUniformSetters:createUniformSetters,drawBufferInfo:drawBufferInfo,drawObjectList:drawObjectList,getWebGLContext:getWebGLContext,getExtensionWithKnownPrefixes:getExtensionWithKnownPrefixes,resizeCanvasToDisplaySize:resizeCanvasToDisplaySize,setAttributes:setAttributes,setBuffersAndAttributes:setBuffersAndAttributes,setUniforms:setUniforms,setupWebGL:setupWebGL}});