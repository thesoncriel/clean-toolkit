import { ClassNameProps } from './components.model';

/**
 * GTM 이벤트 트래킹에 필요한 컴포넌트 프로퍼티.
 */
export interface TrackingProps extends ClassNameProps {
  /**
   * 트래킹에 필요한 컴포넌트 ID.
   */
  id?: string;
  /**
   * 트래킹에 필요한 컴포넌트의 위치
   */
  position?: number;
  /**
   * 각종 특수 행위를 했을 때 발생시킬 트래킹 이벤트 모음
   */
  when?: CustomTrackingMapper;
}

/**
 * 커스텀 트래킹 이벤트 수행이 필요할 때 쓰이는 이벤트 매퍼.
 *
 * 이 후 커스텀 이벤트가 필요하면 계속 추가 바람.
 */
export interface CustomTrackingMapper {
  /**
   * 플릭(또는 스와이프) 행위를 했을 때 발생된 이벤트를 트래킹 한다.
   */
  flick: () => void;
}

type TrackingMapperValueType<P> =
  | string
  | number
  | ((props: P) => string | number);

/**
 * DOM 의 data-attribute 를 삽입하기 위한 매퍼 타입.
 */
export interface DataAttributeMapper<P> {
  [key: string]: TrackingMapperValueType<P>;
}

/**
 * 커스텀 이벤트 트래킹 설정에 사용되는 이벤트 매퍼.
 *
 * 이 후 커스텀 이벤트가 필요하면 계속 추가 바람.
 */
export interface WhenEventMapper<P> {
  flick?: string | ((props: P) => string);
}

/**
 * GTM 트래킹에 필요한 HOC 세팅 내용
 */
export interface GTMTrackingSettings<P> {
  /**
   * 설정 시 컴포넌트에 해당 클래스명을 자동으로 주입 시킨다.
   *
   * 만약 외부에서 다른 className 을 추가적으로 전달 한다면, 그 내용 뒤에 현재 내용을 append 하여 최종 적용한다.
   */
  className?: string | ((props: P) => string);
  /**
   * 설정 시 컴포넌트에 해당 ID값을 자동으로 주입 시킨다.
   *
   * 만약 외부에서 id 값이 들어온다면 무시한다.
   */
  id?: string | ((props: P) => string);
  /**
   * 설정 시 컴포넌트에 data-attribute 세팅을 자동으로 주입 시킨다.
   */
  data?: DataAttributeMapper<P>;
  /**
   * 커스텀 트래킹 이벤트가 필요할 때 설정한다.
   * 사용될 컴포넌트에서 별도로 when 과 그 부속 함수르 수행 해 주어야 트래킹이 가능하다.
   */
  when?: WhenEventMapper<P>;
}
