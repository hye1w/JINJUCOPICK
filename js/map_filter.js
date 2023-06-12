var mapContainer = document.getElementById('map'), // 지도를 표시할 div 
    mapOption = { 
        center: new kakao.maps.LatLng(35.2106,128.1101), // 지도의 중심좌표
        level: 9 // 지도의 확대 레벨
    };

var map = new kakao.maps.Map(mapContainer, mapOption),
    customOverlay = new kakao.maps.CustomOverlay({}),
    infowindow = new kakao.maps.InfoWindow({removable: true});

// 지도에 영역데이터를 폴리곤으로 표시 
for (var i = 0, len = areas.length; i < len; i++) {
    displayArea(areas[i]);
}
 
function displayArea(area) {
    var polygon = new kakao.maps.Polygon({
        map: map, // 다각형을 표시할 지도 객체
        path: area.path,
        strokeWeight: 2,
        strokeColor: '#004c80',
        strokeOpacity: 0.8,
        fillColor: '#fff',
        fillOpacity: 0.7 
    });

    kakao.maps.event.addListener(polygon, 'mouseover', function(mouseEvent) { 
        customOverlay.setContent('<div class="area">' + area.name + '</div>');
        
        customOverlay.setPosition(mouseEvent.latLng); 
        customOverlay.setMap(map);
    });

    kakao.maps.event.addListener(polygon, 'click', function(mouseEvent) {   
        var content = '<div class="area_title">' + area.name + '</div>';
        
        var areaName = area.name;

        var latlng = mouseEvent.latLng; //클릭한 곳 위도, 경도

        // 선택한 영역의 수가 3개 이하인 경우에만 처리
        if (document.querySelectorAll('.area_name div').length < 3) {
          // 이전에 선택한 영역 정보와 비교하여 중복 여부를 확인
          if (!selectedAreas.includes(areaName)) {
            selectedAreas.push(areaName);
            polygon.setOptions({fillColor: '#6092f6'}); //선택 구역 색상 변경

            infowindow.setContent(content); 
            infowindow.setPosition(mouseEvent.latLng); 
            infowindow.setMap(map);

            setTimeout(function() {
                infowindow.close();
            }, 1000); // 1초 후에 인포윈도우 닫기

            // 새로운 div를 생성하여 선택한 영역 정보를 출력
            var areaNamesDiv = document.querySelector('.area_name');
            var newAreaNameDiv = document.createElement('div');
            newAreaNameDiv.textContent = areaName;
            areaNamesDiv.appendChild(newAreaNameDiv);
          }
          else { // 이미 선택된 영역일 경우 해당 영역을 가지는 div 삭제
              polygon.setOptions({fillColor: '#ffffff'}); // 취소 구역 색상 변경 
              var areaNameDivs = document.querySelectorAll('.area_name div');
              areaNameDivs.forEach(function(areaNameDiv) {
                if (areaNameDiv.textContent === areaName) {
                  areaNameDiv.parentNode.removeChild(areaNameDiv);
                }
              }); 
               // 배열에서 해당 영역 제거
               var index = selectedAreas.indexOf(areaName);
               if (index > -1) {
                 selectedAreas.splice(index, 1);
               }
          }
        } else {
            // 선택한 영역의 수가 3개 이상인 경우 선택 취소
            if (selectedAreas.includes(areaName)) {
            polygon.setOptions({fillColor: '#ffffff'}); // 취소 구역 색상 변경
            
            var areaNameDivs = document.querySelectorAll('.area_name div');
            areaNameDivs.forEach(function(areaNameDiv) {
                if (areaNameDiv.textContent === areaName) {
                areaNameDiv.parentNode.removeChild(areaNameDiv);
                }
            }); 

            // 배열에서 해당 영역 제거
            var index = selectedAreas.indexOf(areaName);
            if (index > -1) {
                selectedAreas.splice(index, 1);
            }
            } else {
            // 선택한 영역의 수가 3개 이상인 경우 alert 출력
              alert('최대 3개 구역을 선택 가능합니다.');
            }
        }
            document.filtering.selectMap1.value=selectedAreas[0];  
            document.filtering.selectMap2.value=selectedAreas[1];  
            document.filtering.selectMap3.value=selectedAreas[2];         
      });
}

// 버튼 요소
const btn1 = document.querySelector('#btn1');
const btn2 = document.querySelector('#btn2');
const btn3 = document.querySelector('#btn3');
const btn4 = document.querySelector('#btn4');
const btn5 = document.querySelector('#btn5');
const btn6 = document.querySelector('#btn6');
const btn7 = document.querySelector('#btn7');
const btn8 = document.querySelector('#btn8');
const btn9 = document.querySelector('#btn9');

// btn1~btn8 버튼 중 하나라도 선택되면 btn9를 비활성화 
const disableBtn9 = () => {
  if (btn1.checked || btn2.checked || btn3.checked || btn4.checked || btn5.checked || btn6.checked || btn7.checked || btn8.checked) {
    btn9.disabled = true;
  } else {
    btn9.disabled = false;
  }
};

// btn9 버튼이 선택되면 btn1~btn8 비활성화 
const disableBtns = () => {
  if (btn9.checked) {
    btn1.disabled = true;
    btn2.disabled = true;
    btn3.disabled = true;
    btn4.disabled = true;
    btn5.disabled = true;
    btn6.disabled = true;
    btn7.disabled = true;
    btn8.disabled = true; 
  } else {
    btn1.disabled = false;
    btn2.disabled = false;
    btn3.disabled = false;
    btn4.disabled = false;
    btn5.disabled = false;
    btn6.disabled = false;
    btn7.disabled = false;
    btn8.disabled = false;
  }
};

btn1.addEventListener('change', disableBtn9);
btn2.addEventListener('change', disableBtn9);
btn3.addEventListener('change', disableBtn9);
btn4.addEventListener('change', disableBtn9);
btn5.addEventListener('change', disableBtn9);
btn6.addEventListener('change', disableBtn9);
btn7.addEventListener('change', disableBtn9);
btn8.addEventListener('change', disableBtn9);
btn9.addEventListener('change', disableBtns);
